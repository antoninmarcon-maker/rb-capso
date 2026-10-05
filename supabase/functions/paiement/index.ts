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
      if ((cau.echecs || 0) >= 3) return 'rien';
      const le = Date.parse(cau.bloquee_le || '');
      return isFinite(le) && now.getTime() - le >= 96 * H && now.getTime() < fin.getTime() ? 'renouveler' : 'rien';
    }
    if ((cau.status === 'echec' || cau.status === 'carte_ok') && (cau.echecs || 0) >= 3) return 'rien';
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
      if (evt._payment_method && caution.status !== 'bloquee' && caution.payment_method_id !== evt._payment_method) {
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

// Les cles des deux modes Stripe sont posees une fois pour toutes ; STRIPE_MODE choisit
// le mode actif ("live" ou "test", test par defaut). Passer en prod = changer ce seul secret.
const STRIPE_MODE = (Deno.env.get("STRIPE_MODE") || "test").trim().toLowerCase() === "live" ? "live" : "test";
const AUTRE_MODE = STRIPE_MODE === "live" ? "test" : "live";
const cleStripe = (m: string) => Deno.env.get(`STRIPE_SECRET_KEY_${m.toUpperCase()}`) || "";
const secretWebhook = (m: string) => Deno.env.get(`STRIPE_WEBHOOK_SECRET_${m.toUpperCase()}`) || "";
// Une cle d'un autre mode collee au mauvais endroit est refusee plutot qu'utilisee en silence.
const cleBrute = cleStripe(STRIPE_MODE);
const STRIPE_SECRET_KEY = new RegExp(`^(sk|rk)_${STRIPE_MODE}_`).test(cleBrute) ? cleBrute : "";
console.log(`paiement : mode Stripe ${STRIPE_MODE}${STRIPE_SECRET_KEY ? "" : " (cle absente ou d'un autre mode : appels Stripe refuses)"}`);
const STRIPE_WEBHOOK_SECRET = secretWebhook(STRIPE_MODE);
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
  const { data, error } = await (w.id ? q.eq("id", w.id) : q.eq("access_token", w.token!)).maybeSingle();
  if (error) throw error;
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
  const montantCents = v.mode === "payment" ? LOGIQUE.euroEnCentimes(p.total) : cautionCents;
  const r = await stripe("checkout/sessions", params, `cs-${c.id}-${v.mode}-${montantCents}`);
  if (!r.ok) return json({ error: "Stripe indisponible, réessayez." }, 502);
  return json({ url: r.data.url });
}

async function actionWebhook(req: Request): Promise<Response> {
  const corps = await req.text();
  const entete = req.headers.get("Stripe-Signature") || "";
  const nowSec = Math.floor(Date.now() / 1000);
  const okSig = !!STRIPE_WEBHOOK_SECRET && await LOGIQUE.verifierSignatureStripe(corps, entete, STRIPE_WEBHOOK_SECRET, nowSec);
  if (!okSig) {
    // Evenement authentique de l'autre mode (webhook test apres passage en live, ou
    // l'inverse) : accuse reception sans rien traiter, pour que Stripe ne le rejoue pas.
    const autre = secretWebhook(AUTRE_MODE);
    if (autre && await LOGIQUE.verifierSignatureStripe(corps, entete, autre, nowSec)) return json({ recu: true, ignore: "autre mode" });
    return json({ error: "signature" }, 400);
  }
  const evt = JSON.parse(corps);
  if (evt.livemode !== (STRIPE_MODE === "live")) return json({ recu: true, ignore: "autre mode" });
  // Idempotence : un evenement deja traite est ignore (enregistre seulement apres succes).
  const { data: vu, error: errVu } = await db.from("stripe_events").select("id").eq("id", evt.id).maybeSingle();
  if (errVu) throw errVu;
  if (vu) return json({ recu: true, doublon: true });
  const o = evt.data?.object || {};
  if (evt.type === "checkout.session.completed" && o.mode === "payment" && o.payment_status !== "paid") {
    return json({ recu: true, ignore: true });
  }
  const contractId = o.metadata?.contract_id || o.client_reference_id;
  if (!contractId) return json({ recu: true, ignore: true });
  const c = await chargerContrat({ id: contractId });
  if (!c) return json({ recu: true, ignore: true });
  if (evt.type === "checkout.session.completed") {
    // Le moyen de paiement enregistre vient du PaymentIntent (mode payment) ou du SetupIntent (mode setup).
    const intent = o.mode === "payment" ? await stripe(`payment_intents/${o.payment_intent}`) : await stripe(`setup_intents/${o.setup_intent}`);
    if (!intent.ok) throw new Error("lecture intent Stripe impossible");
    evt._payment_method = intent.data.payment_method;
    if (o.mode === "payment" && c.paiement?.status === "paye_en_ligne" && c.paiement?.checkout_session_id !== o.id) {
      await envoyer(ROMAIN_EMAIL, `⚠️ Paiement en double — contrat #${c.code}`, `<p>Le contrat #${esc(c.code)} était déjà payé en ligne, mais une seconde session de paiement vient d'aboutir : ${euros(o.amount_total || 0)} (session ${esc(o.id)}).</p><p>À rembourser depuis le dashboard Stripe.</p>`);
    }
  }
  evt._now = new Date().toISOString();
  const avant = { paiement: c.paiement || {}, caution: c.caution || {} };
  const apres = LOGIQUE.traiterEvenement(avant, evt);
  if (JSON.stringify(apres) !== JSON.stringify(avant)) {
    await majContrat(c.id, apres);
    await notifierTransition(c, avant, apres);
  }
  const { error: errIns } = await db.from("stripe_events").insert({ id: evt.id, type: evt.type });
  if (errIns && errIns.code !== "23505") throw errIns;
  return json({ recu: true });
}

// deno-lint-ignore no-explicit-any
async function notifierTransition(c: { code: string; payload: Record<string, string> }, avant: any, apres: any) {
  const p = c.payload || {};
  const qui = esc(nomLocataire(p));
  if (avant.paiement.status !== "paye_en_ligne" && apres.paiement.status === "paye_en_ligne") {
    await envoyer(ROMAIN_EMAIL, `Paiement reçu — contrat #${c.code}`, `<p>${qui} a payé ${euros(apres.paiement.montant_cents)} en ligne pour le contrat #${esc(c.code)}.</p>`);
    if (p.l_mail) await envoyer(p.l_mail, "Paiement reçu — RB-CapSO", `<p>Bonjour ${esc(p.l_pre || "")},</p><p>Nous avons bien reçu votre paiement de ${euros(apres.paiement.montant_cents)}.${apres.caution.status === "carte_ok" ? " Votre carte est enregistrée pour la caution, bloquée la veille du départ." : ""}</p><p>RB-CapSO, 06 85 75 75 66</p>`);
  }
  if (avant.caution.status !== "carte_ok" && apres.caution.status === "carte_ok" && avant.caution.status !== "bloquee") {
    await envoyer(ROMAIN_EMAIL, `Carte caution enregistrée — contrat #${c.code}`, `<p>${qui} a enregistré sa carte. L'empreinte de ${euros(apres.caution.montant_cents || 0)} sera posée automatiquement la veille du départ.</p>`);
  }
}
// Pose une empreinte off_session. Ancienne empreinte annulee seulement apres succes.
async function poserEmpreinte(c: any): Promise<{ ok: boolean; motif?: string }> {
  const cau = c.caution || {};
  const montant = LOGIQUE.euroEnCentimes(c.payload?.caution);
  if (!montant || !cau.payment_method_id || !cau.customer_id) return { ok: false, motif: "carte ou montant manquant" };
  const n = (cau.historique?.length || 0) + 1;
  const r = await stripe("payment_intents", {
    amount: montant, currency: "eur", customer: cau.customer_id, payment_method: cau.payment_method_id,
    off_session: "true", confirm: "true", capture_method: "manual", payment_method_types: { 0: "card" },
    description: `Caution contrat #${c.code}`, metadata: { contract_id: c.id, kind: "caution" },
  }, `caution-${c.id}-${n}`);
  const now = new Date().toISOString();
  const historique = [...(cau.historique || []), { le: now, pi: r.data?.id || r.data?.error?.payment_intent?.id || null, ok: r.ok && r.data.status === "requires_capture" }];
  if (r.ok && r.data.status === "requires_capture") {
    const ancien = cau.status === "bloquee" ? cau.payment_intent_id : null;
    const expire = new Date(Date.now() + 4.5 * 86400000).toISOString();
    await majContrat(c.id, { caution: { ...cau, status: "bloquee", payment_intent_id: r.data.id, montant_cents: montant, bloquee_le: now, expire_vers: expire, echecs: 0, dernier_motif: null, historique } });
    if (ancien) {
      const a = await stripe(`payment_intents/${ancien}/cancel`, { cancellation_reason: "requested_by_customer" });
      if (!a.ok && a.data?.error?.code !== "payment_intent_unexpected_state") {
        await envoyer(ROMAIN_EMAIL, `⚠️ Deux empreintes actives — contrat #${c.code}`, `<p>L'ancienne empreinte (${esc(ancien)}) n'a pas pu être annulée automatiquement. À annuler depuis le dashboard Stripe.</p>`);
      }
    }
    if (!ancien) await envoyer(ROMAIN_EMAIL, `Caution bloquée — contrat #${c.code}`, `<p>Empreinte de ${euros(montant)} posée pour ${esc(nomLocataire(c.payload || {}))}.</p>`);
    return { ok: true };
  }
  // Stripe a accepte mais l'empreinte n'est pas exploitable (ex. 3DS requis) : on l'annule pour ne rien laisser en suspens.
  if (r.ok && r.data?.id) await stripe(`payment_intents/${r.data.id}/cancel`, { cancellation_reason: "abandoned" });
  const motif = r.data?.error?.decline_code || r.data?.error?.code || r.data?.status || "inconnu";
  const echecs = (cau.echecs || 0) + 1;
  // Un renouvellement rate laisse l'ancienne empreinte active : on ne la marque pas en echec.
  const status = cau.status === "bloquee" ? "bloquee" : "echec";
  await majContrat(c.id, { caution: { ...cau, status, echecs, dernier_motif: motif, historique } });
  await envoyer(ROMAIN_EMAIL, `⚠️ Caution non bloquée — contrat #${c.code}`, `<p>L'empreinte de ${euros(montant)} pour ${esc(nomLocataire(c.payload || {}))} a échoué (${esc(motif)}), tentative ${echecs}/3. Ouvrez « Mes contrats » pour réessayer ou gérer la caution autrement.</p>`);
  return { ok: false, motif };
}

async function actionCron(): Promise<Response> {
  const { data } = await db.from("contracts").select(COLS).in("type", ["presentiel", "distance"]).eq("status", "signed").neq("caution->>mode", "manuel").not("caution->>payment_method_id", "is", null);
  let traites = 0;
  const now = new Date();
  for (const c of data || []) {
    try {
      const d = LOGIQUE.decisionCaution({ ...c, retourFait: await retourFait(c.id) }, now);
      if (d === "poser" || d === "renouveler") { await poserEmpreinte(c); traites++; }
    } catch (e) { console.error("cron empreinte", c.id, e); }
  }
  // Spec §7 : un contrat annule ne garde jamais d'empreinte active.
  const { data: annules } = await db.from("contracts").select(COLS).in("type", ["presentiel", "distance"]).eq("status", "cancelled").eq("caution->>status", "bloquee");
  for (const c of annules || []) {
    try {
      const r = await stripe(`payment_intents/${c.caution.payment_intent_id}/cancel`, { cancellation_reason: "abandoned" });
      if (r.ok || r.data?.error?.code === "payment_intent_unexpected_state") { await majContrat(c.id, { caution: { ...c.caution, status: "liberee", libere_le: now.toISOString() } }); traites++; }
    } catch (e) { console.error("cron annule", c.id, e); }
  }
  return json({ traites });
}

async function actionAdmin(b: Record<string, any>): Promise<Response> {
  const c = await chargerContrat({ id: String(b.contract_id || "") });
  if (!c) return json({ error: "Contrat introuvable." }, 404);
  if (c.type !== "presentiel" && c.type !== "distance") return json({ error: "Ce document ne donne pas lieu à un paiement." }, 400);
  const pai = { ...(c.paiement || {}) };
  const cau = { ...(c.caution || {}) };
  const now = new Date().toISOString();
  switch (b.op) {
    case "marquer_paye":
      if (pai.status === "paye_en_ligne") return json({ error: "Déjà payé en ligne." }, 400);
      await majContrat(c.id, { paiement: { ...pai, status: "paye_manuel", mode: String(b.mode || "Virement bancaire"), paid_at: now } });
      break;
    case "annuler_paye":
      if (pai.status !== "paye_manuel") return json({ error: "Seul un paiement déclaré peut être annulé." }, 400);
      await majContrat(c.id, { paiement: { ...pai, status: "attente", paid_at: null } });
      break;
    case "caution_manuelle":
      if (cau.status === "liberee" || cau.status === "retenue") return json({ error: "Caution déjà clôturée." }, 400);
      if (b.actif && cau.status === "bloquee") return json({ error: "Libérez d'abord l'empreinte active." }, 400);
      await majContrat(c.id, { caution: { ...cau, mode: b.actif ? "manuel" : "auto", status: b.actif ? "manuel" : (cau.payment_method_id ? "carte_ok" : "carte_manquante") } });
      break;
    case "poser": {
      if (cau.mode === "manuel") return json({ error: "Caution gérée hors ligne." }, 400);
      if (cau.status !== "carte_ok" && cau.status !== "echec") return json({ error: "Aucune empreinte à poser dans cet état." }, 400);
      const r = await poserEmpreinte({ ...c, caution: { ...cau, echecs: 0 } });
      if (!r.ok) return json({ error: `Empreinte refusée (${r.motif}).` }, 400);
      break;
    }
    case "liberer": {
      if (cau.status !== "bloquee") return json({ error: "Aucune empreinte active." }, 400);
      const r = await stripe(`payment_intents/${cau.payment_intent_id}/cancel`, { cancellation_reason: "requested_by_customer" });
      if (!r.ok) return json({ error: "Stripe a refusé la libération." }, 502);
      await majContrat(c.id, { caution: { ...cau, status: "liberee", libere_le: now } });
      if (c.payload?.l_mail) await envoyer(c.payload.l_mail, "Caution libérée — RB-CapSO", `<p>Bonjour ${esc(c.payload.l_pre || "")},</p><p>Votre empreinte de caution de ${euros(cau.montant_cents)} est libérée. Le délai d'affichage dépend de votre banque.</p><p>Merci et à bientôt, RB-CapSO</p>`);
      break;
    }
    case "retenir": {
      const montant = Number(b.montant_cents);
      const v = LOGIQUE.validerRetenue(cau, montant);
      if (!v.ok) return json({ error: v.raison }, 400);
      const r = await stripe(`payment_intents/${cau.payment_intent_id}/capture`, { amount_to_capture: montant }, `retenue-${cau.payment_intent_id}`);
      if (!r.ok) return json({ error: "Stripe a refusé la retenue." }, 502);
      await majContrat(c.id, { caution: { ...cau, status: "retenue", retenu_cents: montant, retenu_le: now } });
      if (c.payload?.l_mail) await envoyer(c.payload.l_mail, "Caution — RB-CapSO", `<p>Bonjour ${esc(c.payload.l_pre || "")},</p><p>Suite à l'état des lieux de retour, ${euros(montant)} ont été retenus sur votre caution de ${euros(cau.montant_cents)}. Le reste est libéré automatiquement.</p><p>RB-CapSO, 06 85 75 75 66</p>`);
      break;
    }
    default:
      return json({ error: "Opération inconnue." }, 400);
  }
  const apres = await chargerContrat({ id: c.id });
  return json({ ok: true, paiement: apres!.paiement, caution: apres!.caution });
}
