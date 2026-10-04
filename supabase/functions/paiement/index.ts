// Edge Function: paiement
// Paiement de la location et caution par empreinte Stripe (spec 2026-10-04).
// Fichier unique : il se deploie en le collant dans le dashboard Supabase.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── LOGIQUE PAIEMENT (debut) ──
// JS pur, sans annotation de type : extrait et teste par web/paiement-logique.test.js.
const LOGIQUE = (() => {
  const MODE_EN_LIGNE = 'Carte bancaire en ligne';
  const H = 3600 * 1000;

  function euroEnCentimes(v) {
    if (v === null || v === undefined) return null;
    const s = String(v).replace(/\s/g, '').replace(',', '.');
    if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
    const c = Math.round(Number(s) * 100);
    return c > 0 ? c : null;
  }

  // Decalage de Paris (minutes) a un instant donne, via Intl (gere l heure d ete).
  function decalageParis(instant) {
    // @ts-ignore - Intl.DateTimeFormat est garanti de retourner le timeZoneName
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'shortOffset' })
      .formatToParts(instant).find((x) => x.type === 'timeZoneName').value; // "GMT+2"
    const m = p.match(/GMT([+-]\d+)(?::(\d+))?/);
    return m ? Number(m[1]) * 60 + Math.sign(Number(m[1])) * Number(m[2] || 0) : 0;
  }

  function parisVersUtc(jjmmaaaa, heure) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(jjmmaaaa || ''));
    if (!m) return null;
    const [j, mo, a] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const naif = Date.UTC(a, mo - 1, j, heure, 0, 0);
    const d = new Date(naif);
    if (d.getUTCFullYear() !== a || d.getUTCMonth() !== mo - 1 || d.getUTCDate() !== j) return null;
    return new Date(naif - decalageParis(new Date(naif)) * 60000);
  }

  const estApresMidi = (h) => String(h || '').indexOf('Après') >= 0;
  const estMatin = (h) => String(h || '').indexOf('Matin') >= 0;
  const departUtc = (debut, debut_h) => parisVersUtc(debut, estApresMidi(debut_h) ? 14 : 9);
  const finUtc = (fin, fin_h) => parisVersUtc(fin, estMatin(fin_h) ? 12 : 19);

  function decisionCaution(c, now) {
    const cau = c.caution || {};
    const p = c.payload || {};
    if (c.status !== 'signed' || c.retourFait || cau.mode === 'manuel') return 'rien';
    if (!cau.payment_method_id || euroEnCentimes(p.caution) === null) return 'rien';
    const dep = departUtc(p.debut, p.debut_h);
    const fin = finUtc(p.fin, p.fin_h);
    if (!dep || !fin || now.getTime() > fin.getTime() + 24 * H) return 'rien';
    if (cau.status === 'bloquee') {
      const le = Date.parse(cau.bloquee_le || '');
      return isFinite(le) && now.getTime() - le >= 96 * H && now.getTime() < fin.getTime() ? 'renouveler' : 'rien';
    }
    if (cau.status === 'echec' && (cau.echecs || 0) >= 3) return 'rien';
    if ((cau.status === 'carte_ok' || cau.status === 'echec') && now.getTime() >= dep.getTime() - 24 * H) return 'poser';
    return 'rien';
  }

  function peutLancerCheckout(c) {
    const p = c.payload || {};
    const pai = c.paiement || {};
    const cau = c.caution || {};
    if (c.status !== 'signed') return { ok: false, raison: "Le contrat doit être signé avant le paiement." };
    if (cau.mode === 'manuel') return { ok: false, raison: "La caution est gérée directement avec RB-CapSO." };
    if (euroEnCentimes(p.caution) === null) return { ok: false, raison: "Montant de caution absent du contrat : contactez RB-CapSO." };
    const carteRequise = !cau.status || cau.status === 'carte_manquante' || cau.status === 'echec';
    const enLigne = Array.isArray(p.paiements) && p.paiements.indexOf(MODE_EN_LIGNE) >= 0;
    const doitPayer = enLigne && pai.status !== 'paye_en_ligne' && pai.status !== 'paye_manuel';
    if (doitPayer) {
      if (euroEnCentimes(p.total) === null) return { ok: false, raison: "Montant du contrat illisible : contactez RB-CapSO." };
      return { ok: true, mode: 'payment' };
    }
    if (carteRequise) return { ok: true, mode: 'setup' };
    return { ok: false, raison: "Paiement et carte déjà enregistrés." };
  }

  function validerRetenue(cau, montantCents) {
    if ((cau || {}).status !== 'bloquee') return { ok: false, raison: "Aucune empreinte active." };
    if (!Number.isInteger(montantCents) || montantCents <= 0) return { ok: false, raison: "Montant invalide." };
    if (montantCents > (cau.montant_cents || 0)) return { ok: false, raison: "Montant supérieur à l'empreinte bloquée." };
    return { ok: true };
  }

  async function verifierSignatureStripe(corps, entete, secret, nowSec) {
    const parts = Object.create(null);
    String(entete || '').split(',').forEach((kv) => { const i = kv.indexOf('='); if (i > 0) (parts[kv.slice(0, i)] ||= []).push(kv.slice(i + 1)); });
    const t = Number((parts.t || [])[0]);
    if (!isFinite(t) || !parts.v1 || Math.abs(nowSec - t) > 300) return false;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(t + '.' + corps)));
    const hex = Array.from(mac, (b) => b.toString(16).padStart(2, '0')).join('');
    return parts.v1.some((v) => v.length === hex.length && v.split('').reduce((d, ch, i) => d | (ch.charCodeAt(0) ^ hex.charCodeAt(i)), 0) === 0);
  }

  function traiterEvenement(etat, evt) {
    const paiement = { ...(etat.paiement || {}) };
    const caution = { ...(etat.caution || {}) };
    const o = (evt.data || {}).object || {};
    if (evt.type === 'checkout.session.completed') {
      if (o.mode === 'payment' && paiement.status !== 'paye_en_ligne') {
        Object.assign(paiement, { status: 'paye_en_ligne', montant_cents: o.amount_total, checkout_session_id: o.id, payment_intent_id: o.payment_intent, paid_at: evt._now });
      }
      if (evt._payment_method && caution.payment_method_id !== evt._payment_method) {
        Object.assign(caution, { status: 'carte_ok', customer_id: o.customer, payment_method_id: evt._payment_method, echecs: 0, dernier_motif: null });
      }
    } else if (evt.type === 'payment_intent.canceled') {
      if (o.id === caution.payment_intent_id && caution.status === 'bloquee') {
        caution.status = 'carte_ok';
        caution.payment_intent_id = null;
      }
    }
    return { paiement, caution };
  }

  function projectionCaution(cau) {
    const c = cau || {};
    return { status: c.status || 'carte_manquante', montant_cents: c.montant_cents || null, bloquee_le: c.bloquee_le || null, expire_vers: c.expire_vers || null, retenu_cents: c.retenu_cents || null };
  }

  return { MODE_EN_LIGNE, euroEnCentimes, departUtc, finUtc, decisionCaution, peutLancerCheckout, validerRetenue, verifierSignatureStripe, traiterEvenement, projectionCaution };
})();
// ── LOGIQUE PAIEMENT (fin) ──

// ── SOCLE DE LA FONCTION ──

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM") || "RB·CAPSO <onboarding@resend.dev>";
const ROMAIN_EMAIL = Deno.env.get("ROMAIN_EMAIL") || "rb.concept.capso@gmail.com";
const APP_URL = Deno.env.get("APP_URL") || "https://rb-capso.com/app";
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://rb-capso.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}
const euros = (c: number) => (c / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

function formEncode(obj: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (typeof v === "object") out.push(...formEncode(v as Record<string, unknown>, key));
    else out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
  }
  return out;
}
async function stripe(chemin: string, params?: Record<string, unknown>, idem?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${STRIPE_SECRET_KEY}` };
  if (params) headers["Content-Type"] = "application/x-www-form-urlencoded";
  if (idem) headers["Idempotency-Key"] = idem;
  const r = await fetch(`https://api.stripe.com/v1/${chemin}`, { method: params ? "POST" : "GET", headers, body: params ? formEncode(params).join("&") : undefined });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) console.error("stripe", chemin, r.status, data?.error?.code, data?.error?.message);
  return { ok: r.ok, status: r.status, data };
}
async function envoyer(to: string, subject: string, html: string): Promise<void> {
  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!r.ok) console.error("resend", r.status, await r.text());
  } catch (e) { console.error("resend", e); }
}
// Meme controle que contract-email : JWT valide ET email present dans `admins`.
async function estAdmin(req: Request): Promise<boolean> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user?.email) return false;
  const { data } = await db.from("admins").select("email").eq("email", user.email).maybeSingle();
  return !!data;
}
const COLS = "id,code,type,status,vehicle,access_token,payload,paiement,caution";
async function chargerContrat(w: { id?: string; token?: string }) {
  if (w.token !== undefined && (typeof w.token !== "string" || w.token.length < 24)) return null;
  if (!w.id && !w.token) return null;
  const q = db.from("contracts").select(COLS);
  const { data } = await (w.id ? q.eq("id", w.id) : q.eq("access_token", w.token!)).maybeSingle();
  return data;
}
async function majContrat(id: string, patch: { paiement?: unknown; caution?: unknown }) {
  const { error } = await db.from("contracts").update(patch).eq("id", id);
  if (error) throw error;
}
async function retourFait(id: string): Promise<boolean> {
  const { data } = await db.from("contracts").select("id").eq("parent_id", id).eq("type", "retour").limit(1);
  return !!(data && data.length);
}
const nomLocataire = (p: Record<string, string>) => `${p.l_pre || ""} ${p.l_nom || ""}`.trim() || "Locataire";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const url = new URL(req.url);
  try {
    if (url.searchParams.get("webhook") === "1") return await actionWebhook(req);
    const body = await req.json();
    if (body.action === "checkout") return await actionCheckout(body);
    if (body.action === "admin") {
      if (!(await estAdmin(req))) return json({ error: "forbidden" }, 403);
      return await actionAdmin(body);
    }
    if (body.action === "cron") {
      if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) return json({ error: "forbidden" }, 403);
      return await actionCron();
    }
    return json({ error: "action inconnue" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "erreur interne" }, 500);
  }
});

async function actionCheckout(b: Record<string, unknown>): Promise<Response> {
  const c = await chargerContrat({ token: String(b.token || "") });
  if (!c) return json({ error: "Lien invalide." }, 404);
  if (c.type !== "presentiel" && c.type !== "distance") return json({ error: "Ce document ne donne pas lieu à un paiement." }, 400);
  const v = LOGIQUE.peutLancerCheckout(c);
  if (!v.ok) return json({ error: v.raison }, 400);
  const p = c.payload || {};
  const cautionCents = LOGIQUE.euroEnCentimes(p.caution)!;
  // Un client Stripe par contrat, reutilise si le locataire recommence.
  let customer = c.caution?.customer_id;
  if (!customer) {
    const r = await stripe("customers", { email: p.l_mail || undefined, name: nomLocataire(p), metadata: { contract_id: c.id, code: c.code } }, `cus-${c.id}`);
    if (!r.ok) return json({ error: "Stripe indisponible, réessayez." }, 502);
    customer = r.data.id;
    await majContrat(c.id, { caution: { ...(c.caution || {}), mode: "auto", status: c.caution?.status || "carte_manquante", customer_id: customer, montant_cents: cautionCents } });
  }
  const retour = `${APP_URL}?t=${encodeURIComponent(c.access_token)}`;
  const texteCaution = `Votre carte est enregistrée pour une empreinte de caution de ${euros(cautionCents)}, posée la veille du départ et débitée seulement en cas de dommage constaté à l'état des lieux (CGV §4).`;
  const commun = {
    customer, client_reference_id: c.id, locale: "fr",
    payment_method_types: { 0: "card" },
    success_url: `${retour}&stripe=ok`, cancel_url: `${retour}&stripe=annule`,
    metadata: { contract_id: c.id, code: c.code },
    custom_text: { submit: { message: texteCaution } },
  };
  const params = v.mode === "payment"
    ? { ...commun, mode: "payment",
        line_items: { 0: { quantity: 1, price_data: { currency: "eur", unit_amount: LOGIQUE.euroEnCentimes(p.total), product_data: { name: `Location ${p.v_nom || "RB-CapSO"} du ${p.debut || "?"} au ${p.fin || "?"}` } } } },
        payment_intent_data: { setup_future_usage: "off_session", description: `Location contrat #${c.code}`, metadata: { contract_id: c.id, kind: "location" } } }
    : { ...commun, mode: "setup", setup_intent_data: { description: `Carte caution contrat #${c.code}`, metadata: { contract_id: c.id, kind: "caution" } } };
  const r = await stripe("checkout/sessions", params);
  if (!r.ok) return json({ error: "Stripe indisponible, réessayez." }, 502);
  return json({ url: r.data.url });
}

async function actionWebhook(req: Request): Promise<Response> {
  const corps = await req.text();
  const okSig = await LOGIQUE.verifierSignatureStripe(corps, req.headers.get("Stripe-Signature") || "", STRIPE_WEBHOOK_SECRET, Math.floor(Date.now() / 1000));
  if (!okSig) return json({ error: "signature" }, 400);
  const evt = JSON.parse(corps);
  // Idempotence : un evenement deja enregistre est ignore.
  const { error: dup } = await db.from("stripe_events").insert({ id: evt.id, type: evt.type });
  if (dup) return json({ recu: true, doublon: true });
  try {
    const o = evt.data?.object || {};
    const contractId = o.metadata?.contract_id || o.client_reference_id;
    if (!contractId) return json({ recu: true, ignore: true });
    const c = await chargerContrat({ id: contractId });
    if (!c) return json({ recu: true, ignore: true });
    if (evt.type === "checkout.session.completed") {
      // Le moyen de paiement enregistre vient du PaymentIntent (mode payment) ou du SetupIntent (mode setup).
      const intent = o.mode === "payment" ? await stripe(`payment_intents/${o.payment_intent}`) : await stripe(`setup_intents/${o.setup_intent}`);
      evt._payment_method = intent.ok ? intent.data.payment_method : null;
    }
    evt._now = new Date().toISOString();
    const avant = { paiement: c.paiement || {}, caution: c.caution || {} };
    const apres = LOGIQUE.traiterEvenement(avant, evt);
    if (JSON.stringify(apres) !== JSON.stringify(avant)) {
      await majContrat(c.id, apres);
      await notifierTransition(c, avant, apres);
    }
    return json({ recu: true });
  } catch (e) {
    // Echec de traitement : on oublie l'evenement pour que Stripe le rejoue.
    await db.from("stripe_events").delete().eq("id", evt.id);
    throw e;
  }
}

// deno-lint-ignore no-explicit-any
async function notifierTransition(c: { code: string; payload: Record<string, string> }, avant: any, apres: any) {
  const p = c.payload || {};
  const qui = esc(nomLocataire(p));
  if (avant.paiement.status !== "paye_en_ligne" && apres.paiement.status === "paye_en_ligne") {
    await envoyer(ROMAIN_EMAIL, `Paiement reçu — contrat #${c.code}`, `<p>${qui} a payé ${euros(apres.paiement.montant_cents)} en ligne pour le contrat #${esc(c.code)}.</p>`);
    if (p.l_mail) await envoyer(p.l_mail, "Paiement reçu — RB-CapSO", `<p>Bonjour ${esc(p.l_pre || "")},</p><p>Nous avons bien reçu votre paiement de ${euros(apres.paiement.montant_cents)}. Votre carte est enregistrée pour la caution, bloquée la veille du départ.</p><p>RB-CapSO, 06 85 75 75 66</p>`);
  }
  if (avant.caution.status !== "carte_ok" && apres.caution.status === "carte_ok" && avant.caution.status !== "bloquee") {
    await envoyer(ROMAIN_EMAIL, `Carte caution enregistrée — contrat #${c.code}`, `<p>${qui} a enregistré sa carte. L'empreinte de ${euros(apres.caution.montant_cents || 0)} sera posée automatiquement la veille du départ.</p>`);
  }
}
async function actionAdmin(_b: Record<string, unknown>): Promise<Response> { return json({ error: "non implémenté" }, 501); }
async function actionCron(): Promise<Response> { return json({ error: "non implémenté" }, 501); }
