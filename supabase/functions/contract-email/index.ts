// Edge Function: contract-email
// Two actions:
//   - invite : envoie au client le lien pour signer son contrat
//   - signed : notifie Romain qu'un contrat vient d'etre signe

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM") || "RB·CAPSO <onboarding@resend.dev>";
const ROMAIN_EMAIL = Deno.env.get("ROMAIN_EMAIL") || "rb.concept.capso@gmail.com";
const APP_URL = Deno.env.get("APP_URL") || "https://rb-capso.com/app";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c] as string);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "method not allowed" }), { status: 405, headers: cors });

  try {
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), { status: 500, headers: cors });
    }
    const { action, code, email, locataire_name } = await req.json();
    if (!action || !code) {
      return new Response(JSON.stringify({ error: "missing action or code" }), { status: 400, headers: cors });
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: contract, error: cerr } = await sb.from("contracts").select("*").eq("code", code).maybeSingle();
    if (cerr || !contract) {
      return new Response(JSON.stringify({ error: "contract not found" }), { status: 404, headers: cors });
    }

    let to: string, subject: string, html: string;
    const link = `${APP_URL}?code=${code}`;
    const p = contract.payload || {};

    if (action === "invite") {
      if (!email) return new Response(JSON.stringify({ error: "email required" }), { status: 400, headers: cors });
      const name = (locataire_name || ((p.l_pre || "") + " " + (p.l_nom || ""))).trim() || "Bonjour";
      to = email;
      subject = "Votre contrat de location RB·CAPSO à signer";
      html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212529;padding:20px">
        <h2 style="color:#7A3608;font-weight:600">RB · CAPSO</h2>
        <p>${esc(name)},</p>
        <p>Votre contrat de location est prêt. Pour le consulter et le signer en ligne, cliquez sur le lien ci-dessous :</p>
        <p style="margin:28px 0;text-align:center"><a href="${esc(link)}" style="background:#F57C28;color:white;padding:13px 26px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Accéder au contrat</a></p>
        <p style="color:#6c757d;font-size:13px">Ou collez ce lien dans votre navigateur :<br><a href="${esc(link)}" style="color:#F57C28;word-break:break-all">${esc(link)}</a></p>
        <p style="margin-top:30px;color:#6c757d;font-size:12px;border-top:1px solid #dee2e6;padding-top:14px">Code de contrat : <strong>${esc(code)}</strong></p>
      </div>`;
    } else if (action === "signed") {
      const locName = ((p.l_pre || "") + " " + (p.l_nom || "")).trim() || "Le locataire";
      to = ROMAIN_EMAIL;
      subject = `Contrat signé · ${code} · ${locName}`;
      html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#212529;padding:20px">
        <h2 style="color:#2d8a30">Contrat signé ✓</h2>
        <p><strong>${esc(locName)}</strong> vient de signer le contrat <strong>#${esc(code)}</strong>.</p>
        <ul style="background:#FFF4EC;border-radius:8px;padding:14px 20px;list-style:none">
          <li>Véhicule : <strong>${esc(p.v_nom || "—")}</strong></li>
          <li>Période : ${esc(p.debut || "—")} → ${esc(p.fin || "—")}</li>
          <li>Total : <strong>${esc(p.total || "—")} €</strong></li>
          <li>Caution : ${esc(p.caution || "—")} €</li>
        </ul>
        <p style="margin:24px 0"><a href="${esc(link)}" style="color:#F57C28;font-weight:600">Voir le contrat signé →</a></p>
        <p style="color:#6c757d;font-size:12px;border-top:1px solid #dee2e6;padding-top:14px">Connectez-vous à <a href="${esc(APP_URL)}" style="color:#F57C28">RB·CAPSO</a> pour télécharger le PDF dans "Mes contrats".</p>
      </div>`;
    } else {
      return new Response(JSON.stringify({ error: "unknown action" }), { status: 400, headers: cors });
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    const body = await r.text();
    if (!r.ok) {
      console.error("resend error", r.status, body);
      return new Response(JSON.stringify({ error: "resend " + r.status, body }), { status: 502, headers: cors });
    }
    return new Response(body, { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: cors });
  }
});
