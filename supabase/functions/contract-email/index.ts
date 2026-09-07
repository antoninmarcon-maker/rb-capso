// Edge Function: contract-email
// Three actions:
//   - invite : envoie au client le lien (base sur l'access_token) pour signer
//              son contrat. RESERVE A UN ADMIN AUTHENTIFIE.
//   - signed : notifie Romain qu'un contrat vient d'etre signe. Appelable par
//              le locataire (anon) juste apres signature ; identifie le contrat
//              par son access_token, jamais par le code a 4 chiffres.
//   - accuse : accuse de reception au client juste apres sa demande de
//              reservation sur le site (anon). Identifie la reservation par son
//              uuid (imprevisible), dans les 15 minutes qui suivent sa creation.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM") || "RB·CAPSO <onboarding@resend.dev>";
const ROMAIN_EMAIL = Deno.env.get("ROMAIN_EMAIL") || "rb.concept.capso@gmail.com";
// Base de l'app pour construire le lien locataire (ex: https://rb-capso.com/app).
const APP_URL = Deno.env.get("APP_URL") || "https://rb-capso.com/app";
// Origine autorisee pour CORS, verrouillee sur le domaine de prod.
const ALLOWED_ORIGIN = Deno.env.get("ALLOWED_ORIGIN") || "https://rb-capso.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

const cors = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c] as string);
}

async function envoyer(to: string, subject: string, html: string): Promise<Response> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  const body = await r.text();
  if (!r.ok) {
    console.error("resend error", r.status, body);
    return json({ error: "resend " + r.status, body }, 502);
  }
  return new Response(body, { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
}

const VEHICULES: Record<string, string> = { penelop: "Pénélope, le fourgon", peggy: "Peggy, le van", tente: "la tente de toit", pamela: "Pamela" };
const OPTIONS: Record<string, string> = { surf: "planche de surf", paddle: "stand-up paddle", kayak: "canoë-kayak", linge: "kit linge de lit", materiel: "matériel de camping" };
function dateFr(d: string): string {
  return new Date(d + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}

// Verifie que l'appelant porte un JWT valide ET que son email est dans `admins`.
// Renvoie l'email admin si OK, sinon null.
async function getAdminEmail(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;
  // Client lie au JWT de l'appelant (anon key + header) pour resoudre l'utilisateur.
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user?.email) return null;
  // Verifie l'appartenance a la table admins via le service role (bypass RLS).
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: row, error: aerr } = await admin
    .from("admins").select("email").eq("email", user.email).maybeSingle();
  if (aerr || !row) return null;
  return user.email;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    if (!RESEND_API_KEY) return json({ error: "RESEND_API_KEY not configured" }, 500);

    const { action, token, email, locataire_name, id } = await req.json();

    if (action === "accuse") {
      if (!id || !/^[0-9a-f-]{36}$/i.test(String(id))) return json({ error: "id required" }, 400);
      const sb0 = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: r, error: rerr } = await sb0.from("reservations").select("*").eq("id", id).maybeSingle();
      if (rerr || !r || !r.email) return json({ error: "reservation not found" }, 404);
      // Fenetre courte : le site appelle dans la foulee de la demande. Au-dela, rien.
      if (Date.now() - new Date(r.created_at).getTime() > 15 * 60 * 1000) return json({ error: "too late" }, 410);
      const prenom = String(r.prenom || "").trim();
      const veh = VEHICULES[r.vehicle] || r.vehicle;
      const jours = Math.round((new Date(r.end_date).getTime() - new Date(r.start_date).getTime()) / 86400000) + 1;
      const opts = Array.isArray(r.options) ? r.options.map((o: string) => OPTIONS[o] || o).join(", ") : "";
      const est = typeof r.estimation_cents === "number" && r.estimation_cents > 0
        ? (r.estimation_cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " €" : "";
      const lignes = [
        `<li>Véhicule : <strong>${esc(veh)}</strong></li>`,
        `<li>Dates : du <strong>${esc(dateFr(r.start_date))}</strong> au <strong>${esc(dateFr(r.end_date))}</strong> (${jours} jour${jours > 1 ? "s" : ""})</li>`,
        r.forfait && r.vehicle !== "tente" ? `<li>Forfait kilométrique : ${esc(r.forfait)}</li>` : "",
        opts ? `<li>Options : ${esc(opts)}</li>` : "",
        est ? `<li>Estimation : <strong>${esc(est)}</strong> (hors frais de service, montant définitif sur le contrat)</li>` : "",
      ].filter(Boolean).join("");
      const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212529;padding:20px">
        <h2 style="color:#2C5F6E;font-weight:600">RB · CAPSO</h2>
        <p>Bonjour${prenom ? " " + esc(prenom) : ""},</p>
        <p>Merci pour votre demande de réservation, elle est bien arrivée. Voici ce que nous avons noté :</p>
        <ul style="background:#F5F0E8;border-radius:8px;padding:14px 20px 14px 34px">${lignes}</ul>
        <p>Romain vérifie les disponibilités et vous répond <strong>sous 24 à 48 h</strong>, par email ou par téléphone. Vous n'avez rien à faire pour l'instant : aucun paiement n'est demandé avant la confirmation.</p>
        <p>Une question, une envie de partir plus vite ? Écrivez-lui sur <a href="https://api.whatsapp.com/send?phone=%2B33685757566" style="color:#2C5F6E">WhatsApp</a> ou appelez le 06 85 75 75 66.</p>
        <p style="color:#6c757d;font-size:13px;border-top:1px solid #dee2e6;padding-top:14px;margin-top:24px">RB-CapSO · vans aménagés fabriqués main à Capbreton · <a href="https://rb-capso.com" style="color:#2C5F6E">rb-capso.com</a></p>
      </div>`;
      return await envoyer(r.email, "Votre demande de réservation RB·CAPSO est bien reçue", html);
    }

    if (!action || !token) return json({ error: "missing action or token" }, 400);

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: contract, error: cerr } = await sb
      .from("contracts").select("*").eq("access_token", token).maybeSingle();
    if (cerr || !contract) return json({ error: "contract not found" }, 404);

    let to: string, subject: string, html: string;
    // Lien locataire base sur le token (imprevisible), jamais sur le code.
    const link = `${APP_URL}?t=${encodeURIComponent(contract.access_token)}`;
    const p = contract.payload || {};
    // Trois documents signables (contrat, etat des lieux de depart, PV de retour) :
    // sujets et corps s'accordent au type, sinon un locataire recoit « votre
    // contrat » pour un etat des lieux et ne comprend pas ce qu'il signe.
    const DOCS: Record<string, { votre: string; le: string; court: string }> = {
      presentiel: { votre: "votre contrat de location", le: "le contrat de location", court: "Contrat" },
      distance:   { votre: "votre contrat de location", le: "le contrat de location", court: "Contrat" },
      edl_depart: { votre: "votre état des lieux de départ", le: "l'état des lieux de départ", court: "État des lieux de départ" },
      retour:     { votre: "votre procès-verbal de retour", le: "le procès-verbal de retour", court: "PV de retour" },
    };
    const docu = DOCS[contract.type] ?? { votre: "votre document", le: "le document", court: "Document" };
    const votreMaj = docu.votre.charAt(0).toUpperCase() + docu.votre.slice(1);

    if (action === "invite") {
      // RESERVE ADMIN : on n'envoie le lien de signature qu'a la demande d'un
      // admin authentifie. Le destinataire arbitraire n'est plus accepte sans
      // controle (sinon fuite du lien/contrat a n'importe qui).
      const adminEmail = await getAdminEmail(req);
      if (!adminEmail) return json({ error: "unauthorized" }, 401);
      if (!email) return json({ error: "email required" }, 400);

      const name = (locataire_name || ((p.l_pre || "") + " " + (p.l_nom || ""))).trim() || "Bonjour";
      to = email;
      subject = `${votreMaj} RB·CAPSO à signer`;
      html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212529;padding:20px">
        <h2 style="color:#7A3608;font-weight:600">RB · CAPSO</h2>
        <p>${esc(name)},</p>
        <p>${esc(votreMaj)} est prêt. Pour le consulter et le signer en ligne, cliquez sur le lien ci-dessous :</p>
        <p style="margin:28px 0;text-align:center"><a href="${esc(link)}" style="background:#F57C28;color:white;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Accéder au document</a></p>
        <p style="color:#6c757d;font-size:13px">Ou collez ce lien dans votre navigateur :<br><a href="${esc(link)}" style="color:#F57C28;word-break:break-all">${esc(link)}</a></p>
      </div>`;
    } else if (action === "signed") {
      // Appelable par le locataire (anon) apres signature. On notifie l'owner.
      const locName = ((p.l_pre || "") + " " + (p.l_nom || "")).trim() || "Le locataire";
      const ref = contract.code || "—";
      to = ROMAIN_EMAIL;
      subject = `${docu.court} signé · ${ref} · ${locName}`;
      html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212529;padding:20px">
        <h2 style="color:#2d8a30">${esc(docu.court)} signé ✓</h2>
        <p><strong>${esc(locName)}</strong> vient de signer ${esc(docu.le)} <strong>#${esc(ref)}</strong>.</p>
        <ul style="background:#FFF4EC;border-radius:8px;padding:14px 20px;list-style:none">
          ${p.ref_code ? `<li>Contrat associé : <strong>#${esc(p.ref_code)}</strong></li>` : ""}
          <li>Véhicule : <strong>${esc(p.v_nom || "—")}</strong></li>
          <li>Période : ${esc(p.debut || "—")} → ${esc(p.fin || "—")}</li>
          <li>Total : <strong>${esc(p.total || "—")} €</strong></li>
          <li>Caution : ${esc(p.caution || "—")} €</li>
        </ul>
        <p style="color:#6c757d;font-size:12px;border-top:1px solid #dee2e6;padding-top:14px">Connectez-vous à <a href="${esc(APP_URL)}" style="color:#F57C28">RB·CAPSO</a> pour télécharger le PDF dans "Mes contrats".</p>
      </div>`;
    } else {
      return json({ error: "unknown action" }, 400);
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const body = await r.text();
    if (!r.ok) {
      console.error("resend error", r.status, body);
      return json({ error: "resend " + r.status, body }, 502);
    }
    return new Response(body, { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return json({ error: String(e) }, 500);
  }
});
