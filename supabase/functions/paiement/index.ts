// Edge Function: paiement
// Paiement de la location et caution par empreinte Stripe (spec 2026-10-04).
// Fichier unique : il se deploie en le collant dans le dashboard Supabase.

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
    const parts = {};
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
