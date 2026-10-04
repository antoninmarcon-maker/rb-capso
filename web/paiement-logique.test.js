/*
 * Logique pure de la fonction `paiement` (supabase/functions/paiement/index.ts).
 * Lancer : node web/paiement-logique.test.js
 * La fonction se deploie en un seul fichier (dashboard Supabase) : la logique y vit
 * entre les marqueurs « LOGIQUE PAIEMENT (debut) / (fin) », en JS sans annotation de
 * type, pour etre extraite et executee ici avec vm, comme web/pricing.test.js.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, '../supabase/functions/paiement/index.ts'), 'utf8');
const m = src.match(/\/\/ ── LOGIQUE PAIEMENT \(debut\) ──\n([\s\S]*?)\/\/ ── LOGIQUE PAIEMENT \(fin\) ──/);
assert.ok(m, 'bloc LOGIQUE PAIEMENT introuvable dans index.ts');
const ctx = { crypto: globalThis.crypto, TextEncoder, Intl, Date, Math, Number, String, JSON, Object, Array };
vm.createContext(ctx);
vm.runInContext(m[1] + '\nthis.L = LOGIQUE;', ctx);
const L = ctx.L;
const plain = (x) => JSON.parse(JSON.stringify(x));

// euroEnCentimes
assert.strictEqual(L.euroEnCentimes('1200'), 120000);
assert.strictEqual(L.euroEnCentimes('1200.5'), 120050);
assert.strictEqual(L.euroEnCentimes('1 200,50'), 120050);
assert.strictEqual(L.euroEnCentimes(3000), 300000);
for (const bad of ['', '—', null, undefined, '0', '-5', 'abc', NaN]) {
  assert.strictEqual(L.euroEnCentimes(bad), null, 'refuse ' + bad);
}

// departUtc / finUtc : heure de Paris, ete (UTC+2) et hiver (UTC+1)
assert.strictEqual(L.departUtc('10/10/2026', 'Matin').toISOString(), '2026-10-10T07:00:00.000Z');
assert.strictEqual(L.departUtc('10/10/2026', 'Après-midi').toISOString(), '2026-10-10T12:00:00.000Z');
// changement d'heure le 25/10/2026 : le 26 est en UTC+1
assert.strictEqual(L.departUtc('26/10/2026', 'Matin').toISOString(), '2026-10-26T08:00:00.000Z');
assert.strictEqual(L.finUtc('12/10/2026', 'Matin').toISOString(), '2026-10-12T10:00:00.000Z');
assert.strictEqual(L.finUtc('12/10/2026', '').toISOString(), '2026-10-12T17:00:00.000Z');
assert.strictEqual(L.departUtc('32/13/2026', 'Matin'), null);
assert.strictEqual(L.departUtc('', 'Matin'), null);

// decisionCaution
const base = {
  status: 'signed', retourFait: false,
  payload: { debut: '26/10/2026', debut_h: 'Matin', fin: '05/11/2026', fin_h: 'Matin', caution: '3000' },
  caution: { mode: 'auto', status: 'carte_ok', payment_method_id: 'pm_1', echecs: 0 },
};
const t = (iso) => new Date(iso);
// 25 h avant le depart (26/10 08:00Z) : rien ; 23 h avant : poser
assert.strictEqual(L.decisionCaution(base, t('2026-10-25T07:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution(base, t('2026-10-25T09:00:00Z')), 'poser');
// signe le jour meme apres l'heure de depart : poser
assert.strictEqual(L.decisionCaution(base, t('2026-10-26T15:00:00Z')), 'poser');
// pas de carte, mode manuel, retour fait, annule, 3 echecs : rien
assert.strictEqual(L.decisionCaution({ ...base, caution: { mode: 'auto', status: 'carte_manquante' } }, t('2026-10-26T00:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution({ ...base, caution: { ...base.caution, mode: 'manuel' } }, t('2026-10-26T00:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution({ ...base, retourFait: true }, t('2026-10-26T00:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution({ ...base, status: 'cancelled' }, t('2026-10-26T00:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution({ ...base, caution: { ...base.caution, status: 'echec', echecs: 3 } }, t('2026-10-26T00:00:00Z')), 'rien');
// echec < 3 : on retente
assert.strictEqual(L.decisionCaution({ ...base, caution: { ...base.caution, status: 'echec', echecs: 1 } }, t('2026-10-26T00:00:00Z')), 'poser');
// bloquee depuis 4 jours, location en cours : renouveler ; depuis 3 j : rien ; apres la fin : rien
const bloq = (le) => ({ ...base, caution: { ...base.caution, status: 'bloquee', payment_intent_id: 'pi_1', bloquee_le: le } });
assert.strictEqual(L.decisionCaution(bloq('2026-10-25T09:00:00Z'), t('2026-10-29T09:00:00Z')), 'renouveler');
assert.strictEqual(L.decisionCaution(bloq('2026-10-25T09:00:00Z'), t('2026-10-28T09:00:00Z')), 'rien');
assert.strictEqual(L.decisionCaution(bloq('2026-11-01T09:00:00Z'), t('2026-11-06T09:00:00Z')), 'rien');
// renouvellement rate 3 fois : on s'arrete (l'ancienne empreinte reste)
assert.strictEqual(L.decisionCaution({ ...bloq('2026-10-25T09:00:00Z'), caution: { ...bloq('2026-10-25T09:00:00Z').caution, echecs: 3 } }, t('2026-10-29T09:00:00Z')), 'rien');
// dates illisibles : rien (jamais d'empreinte au hasard)
assert.strictEqual(L.decisionCaution({ ...base, payload: { ...base.payload, debut: '' } }, t('2026-10-26T00:00:00Z')), 'rien');

// peutLancerCheckout
const signe = (paiements, total, caution, etat = {}) => ({
  status: 'signed', payload: { paiements, total, caution }, paiement: etat.paiement || {}, caution: etat.caution || {},
});
assert.deepStrictEqual(plain(L.peutLancerCheckout(signe(['Carte bancaire en ligne'], '650', '3000'))), { ok: true, mode: 'payment' });
assert.deepStrictEqual(plain(L.peutLancerCheckout(signe(['Virement bancaire'], '650', '3000'))), { ok: true, mode: 'setup' });
// deja paye en ligne, carte manquante (impossible en pratique) : setup seulement
assert.deepStrictEqual(plain(L.peutLancerCheckout(signe(['Carte bancaire en ligne'], '650', '3000', { paiement: { status: 'paye_en_ligne' } }))), { ok: true, mode: 'setup' });
// paye ET carte enregistree : refuse
assert.strictEqual(L.peutLancerCheckout(signe(['Carte bancaire en ligne'], '650', '3000', { paiement: { status: 'paye_en_ligne' }, caution: { status: 'carte_ok' } })).ok, false);
// carte en echec : on peut reenregistrer une carte
assert.deepStrictEqual(plain(L.peutLancerCheckout(signe(['Virement bancaire'], '650', '3000', { caution: { status: 'echec' } }))), { ok: true, mode: 'setup' });
// non signe, total illisible en mode payment, caution illisible, caution manuelle : refuse
assert.strictEqual(L.peutLancerCheckout({ ...signe(['Virement bancaire'], '650', '3000'), status: 'pending' }).ok, false);
assert.strictEqual(L.peutLancerCheckout(signe(['Carte bancaire en ligne'], '—', '3000')).ok, false);
assert.strictEqual(L.peutLancerCheckout(signe(['Virement bancaire'], '650', '')).ok, false);
assert.strictEqual(L.peutLancerCheckout(signe(['Virement bancaire'], '650', '3000', { caution: { mode: 'manuel' } })).ok, false);

// validerRetenue
const cb = { status: 'bloquee', montant_cents: 300000 };
assert.strictEqual(L.validerRetenue(cb, 45000).ok, true);
assert.strictEqual(L.validerRetenue(cb, 300000).ok, true);
assert.strictEqual(L.validerRetenue(cb, 300001).ok, false);
assert.strictEqual(L.validerRetenue(cb, 0).ok, false);
assert.strictEqual(L.validerRetenue(cb, -1).ok, false);
assert.strictEqual(L.validerRetenue(cb, 12.5).ok, false);
assert.strictEqual(L.validerRetenue({ status: 'liberee', montant_cents: 300000 }, 100).ok, false);

// traiterEvenement : checkout paiement, checkout setup, empreinte expiree, idempotence
const etat0 = { paiement: { status: 'attente' }, caution: { mode: 'auto', status: 'carte_manquante', montant_cents: 300000 } };
const evtPay = { type: 'checkout.session.completed', data: { object: { id: 'cs_1', mode: 'payment', amount_total: 65000, payment_intent: 'pi_pay', customer: 'cus_1' } }, _payment_method: 'pm_1', _now: '2026-10-04T10:00:00Z' };
const e1 = L.traiterEvenement(etat0, evtPay);
assert.strictEqual(e1.paiement.status, 'paye_en_ligne');
assert.strictEqual(e1.paiement.montant_cents, 65000);
assert.strictEqual(e1.caution.status, 'carte_ok');
assert.strictEqual(e1.caution.payment_method_id, 'pm_1');
assert.deepStrictEqual(plain(L.traiterEvenement(e1, evtPay)), plain(e1), 'idempotent');
const evtSetup = { type: 'checkout.session.completed', data: { object: { id: 'cs_2', mode: 'setup', customer: 'cus_1' } }, _payment_method: 'pm_2', _now: '2026-10-04T10:00:00Z' };
const e2 = L.traiterEvenement(etat0, evtSetup);
assert.strictEqual(e2.paiement.status, 'attente');
assert.strictEqual(e2.caution.status, 'carte_ok');
// carte en echec puis nouvelle carte : echecs remis a zero
const e3 = L.traiterEvenement({ ...etat0, caution: { ...etat0.caution, status: 'echec', echecs: 3 } }, evtSetup);
assert.strictEqual(e3.caution.status, 'carte_ok');
assert.strictEqual(e3.caution.echecs, 0);
// expiration de l'empreinte active : retour a carte_ok (le cron la reposera)
const bloquee = { ...e2, caution: { ...e2.caution, status: 'bloquee', payment_intent_id: 'pi_c1' } };
const exp = { type: 'payment_intent.canceled', data: { object: { id: 'pi_c1', cancellation_reason: 'automatic' } }, _now: '2026-10-11T10:00:00Z' };
assert.strictEqual(L.traiterEvenement(bloquee, exp).caution.status, 'carte_ok');
// annulation d'une ancienne empreinte (renouvellement) : sans effet sur l'active
const vieux = { ...exp, data: { object: { id: 'pi_ancien', cancellation_reason: 'requested_by_customer' } } };
assert.deepStrictEqual(plain(L.traiterEvenement(bloquee, vieux)), plain(bloquee));
// annulation de l'active deja marquee liberee : reste liberee
const lib = { ...bloquee, caution: { ...bloquee.caution, status: 'liberee' } };
assert.strictEqual(L.traiterEvenement(lib, { ...exp, data: { object: { id: 'pi_c1', cancellation_reason: 'requested_by_customer' } } }).caution.status, 'liberee');

// projectionCaution : jamais d'identifiant Stripe
const proj = L.projectionCaution({ ...bloquee.caution, customer_id: 'cus_1', bloquee_le: 'x', expire_vers: 'y' });
assert.deepStrictEqual(Object.keys(plain(proj)).sort(), ['bloquee_le', 'expire_vers', 'montant_cents', 'retenu_cents', 'status']);

// verifierSignatureStripe (HMAC-SHA256 de `${t}.${corps}`)
// carte enregistree pendant une empreinte active : la caution n'est pas touchee
const actif = { paiement: { status: 'attente' }, caution: { mode: 'auto', status: 'bloquee', payment_intent_id: 'pi_c9', payment_method_id: 'pm_old' } };
const eAct = L.traiterEvenement(actif, evtPay);
assert.strictEqual(eAct.paiement.status, 'paye_en_ligne');
assert.deepStrictEqual(plain(eAct.caution), plain(actif.caution));

(async () => {
  const secret = 'whsec_test';
  const corps = '{"id":"evt_1"}';
  const ts = 1790000000;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = Buffer.from(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ts + '.' + corps))).toString('hex');
  assert.strictEqual(await L.verifierSignatureStripe(corps, `t=${ts},v1=${sig}`, secret, ts + 10), true);
  assert.strictEqual(await L.verifierSignatureStripe(corps + ' ', `t=${ts},v1=${sig}`, secret, ts + 10), false);
  assert.strictEqual(await L.verifierSignatureStripe(corps, `t=${ts},v1=${sig}`, secret, ts + 301), false, 'trop vieux');
  assert.strictEqual(await L.verifierSignatureStripe(corps, '', secret, ts), false);
  assert.strictEqual(await L.verifierSignatureStripe(corps, `t=${ts},v1=${sig}`, 'autre', ts), false);
  console.log('paiement-logique : OK');
})().catch((e) => { console.error(e); process.exit(1); });
