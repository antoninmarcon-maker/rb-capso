# Paiement en ligne et caution Stripe — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** le locataire paie (ou non) en ligne et enregistre obligatoirement sa carte depuis son lien de contrat ; l'empreinte de caution est posée et renouvelée automatiquement ; Romain suit et pilote tout depuis `/app`.

**Architecture:** une Edge Function Supabase unique `paiement` (actions `checkout`, `webhook`, `admin`, `cron`) parle à l'API Stripe en `fetch` form-encodé, sans SDK. Deux colonnes `contracts.paiement` / `contracts.caution` (jsonb) portent l'état ; `pg_cron` + `pg_net` appellent l'action `cron` toutes les heures. Le front (`web/app/index.html`, vanilla JS) ajoute le mode « Carte bancaire en ligne », le bloc de paiement après signature, les pastilles et actions dans « Mes contrats » et l'écran Retour.

**Tech Stack:** Supabase (Postgres, pg_cron, pg_net, Vault, Edge Functions Deno), Stripe Checkout + PaymentIntents (capture manuelle, off_session), Resend, vanilla JS, tests `node` sans dépendance.

**Spec:** `docs/superpowers/specs/2026-10-04-paiement-caution-stripe-design.md`

## Global Constraints

- Zéro dépendance npm, zéro bundler (projet existant). Tests : `node web/<x>.test.js`, découverts par la CI (`find web -name '*.test.js'`).
- La fonction `paiement` tient en **un seul fichier** `supabase/functions/paiement/index.ts` : elle se déploie en collant ce fichier dans le dashboard Supabase de Romain (pas d'accès CLI). Copier avec `LANG=en_US.UTF-8 pbcopy < …` (sinon accents abîmés).
- Clés Stripe uniquement dans les secrets Supabase (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET`) ; jamais dans le repo ni le navigateur.
- Montant payé = `payload.total` lu **côté serveur** (recalculé par la base à la signature, migration 013). Montant de caution = `payload.caution` (euros).
- Dates du payload : `debut`/`fin` au format `JJ/MM/AAAA`, créneaux `debut_h`/`fin_h` contenant `Matin` ou `Après` ; heure de Paris.
- Empreinte : posée quand le départ est à ≤ 24 h ; renouvelée quand elle a ≥ 4 jours ; arrêt après 3 échecs.
- Ordre de mise en prod : migration → fonction + secrets → webhook Stripe → merge du front.
- Textes en français, accessibilité WCAG 2.1 AA (CI axe ; baseline `.github/a11y-baseline.json` jamais enrichie).
- Classe de revue CRITIQUE (skill ship) : trois revues Fable/Astra, fusion épinglée `--match-head-commit`.

## Review Focus

1. **Webhook reçu deux fois ou dans le désordre** (Stripe rejoue) → aucun double effet, l'état final reste juste. Test : `traiterEvenement` appliqué deux fois au même événement donne le même état (Task 1).
2. **Locataire qui clique deux fois sur « Payer » ou revient après avoir payé** → pas de second paiement ; le bouton disparaît dès que `paiement.status = 'paye_en_ligne'`. Test : `peutLancerCheckout` refuse (Task 1) + contrôle serveur (Task 4).
3. **Total ou caution absents, nuls ou illisibles** (`"—"`, `""`, `"1 200,50"`) → checkout refusé avec message clair, jamais un paiement de 0 € ou d'un montant faux. Test : `euroEnCentimes` (Task 1).
4. **Changement d'heure (fin octobre) et créneau après-midi** → l'empreinte part bien la veille, pas une heure trop tard ou le jour même. Test : `departUtc` autour du 25/10/2026 (Task 1).
5. **Retenue supérieure au montant bloqué ou négative** → refusée côté serveur avec message, aucune capture. Test : `validerRetenue` (Task 1).

---

## Fichiers

| Fichier | Rôle |
|---|---|
| `supabase/functions/paiement/index.ts` (créé) | Fonction unique. Bloc `LOGIQUE PAIEMENT (debut/fin)` en JS pur (testé par node), puis Stripe, Resend, routage des actions. |
| `web/paiement-logique.test.js` (créé) | Extrait le bloc logique de `index.ts` et le teste (pattern de `web/pricing.test.js`). |
| `supabase/migrations/014_paiement_caution.sql` (créé) | Colonnes, table `stripe_events`, projection locataire, cron horaire. |
| `supabase/APPLY.md` (modifié) | Procédure de mise en service, vérifications, rollback. |
| `web/app/index.html` (modifié) | Mode « Carte bancaire en ligne », bloc paiement locataire, pastilles + actions admin, écran Retour. |

---

### Task 1: Logique pure (montants, dates, décision d'empreinte, signature webhook, transitions)

**Files:**
- Create: `supabase/functions/paiement/index.ts` (bloc logique seulement à cette étape)
- Test: `web/paiement-logique.test.js`

**Interfaces:**
- Produces (dans le bloc, JS sans annotation de type, exposé par `const LOGIQUE = { … }`) :
  - `euroEnCentimes(v) → number|null` — `"1200"`, `"1200.5"`, `"1 200,50"`, `1200` → centimes ; vide, `"—"`, ≤ 0, NaN → `null`.
  - `departUtc(debut, debut_h) → Date|null` — Matin 09:00, Après-midi 14:00, heure de Paris.
  - `finUtc(fin, fin_h) → Date|null` — Matin 12:00, Après-midi/défaut 19:00, heure de Paris.
  - `decisionCaution(c, now) → 'poser'|'renouveler'|'rien'` où `c = {status, caution, payload, retourFait}`.
  - `peutLancerCheckout(c) → {ok:true, mode:'payment'|'setup'} | {ok:false, raison}`.
  - `validerRetenue(caution, montantCents) → {ok:true} | {ok:false, raison}`.
  - `verifierSignatureStripe(corps, entete, secret, nowSec) → Promise<boolean>` (WebCrypto, tolérance 300 s).
  - `traiterEvenement(etat, evt) → {paiement, caution}` — transition pure, idempotente.
  - `projectionCaution(caution) → {status, montant_cents, bloquee_le, expire_vers, retenu_cents}`.

- [ ] **Step 1: Write the failing test** — `web/paiement-logique.test.js`

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node web/paiement-logique.test.js`
Expected: FAIL, `ENOENT … supabase/functions/paiement/index.ts`

- [ ] **Step 3: Write minimal implementation** — créer `supabase/functions/paiement/index.ts` avec ce bloc (le reste du fichier arrive en Task 3) :

```ts
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

  // Decalage de Paris (minutes) a un instant donne, via Intl (gere l'heure d'ete).
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
    if (c.status !== 'signed') return { ok: false, raison: 'Le contrat doit être signé avant le paiement.' };
    if (cau.mode === 'manuel') return { ok: false, raison: 'La caution est gérée directement avec RB-CapSO.' };
    if (euroEnCentimes(p.caution) === null) return { ok: false, raison: 'Montant de caution absent du contrat : contactez RB-CapSO.' };
    const carteRequise = !cau.status || cau.status === 'carte_manquante' || cau.status === 'echec';
    const enLigne = Array.isArray(p.paiements) && p.paiements.indexOf(MODE_EN_LIGNE) >= 0;
    const doitPayer = enLigne && pai.status !== 'paye_en_ligne' && pai.status !== 'paye_manuel';
    if (doitPayer) {
      if (euroEnCentimes(p.total) === null) return { ok: false, raison: 'Montant du contrat illisible : contactez RB-CapSO.' };
      return { ok: true, mode: 'payment' };
    }
    if (carteRequise) return { ok: true, mode: 'setup' };
    return { ok: false, raison: 'Paiement et carte déjà enregistrés.' };
  }

  function validerRetenue(cau, montantCents) {
    if ((cau || {}).status !== 'bloquee') return { ok: false, raison: 'Aucune empreinte active.' };
    if (!Number.isInteger(montantCents) || montantCents <= 0) return { ok: false, raison: 'Montant invalide.' };
    if (montantCents > (cau.montant_cents || 0)) return { ok: false, raison: 'Montant supérieur à l’empreinte bloquée.' };
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node web/paiement-logique.test.js`
Expected: `paiement-logique : OK`

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/paiement/index.ts web/paiement-logique.test.js
git commit -m "feat(paiement): logique pure du paiement et de la caution, testée"
```

---

### Task 2: Migration 014 (colonnes, idempotence, projection locataire, cron)

**Files:**
- Create: `supabase/migrations/014_paiement_caution.sql`
- Modify: `supabase/APPLY.md` (ajouter une section en fin de fichier)

**Interfaces:**
- Produces : `contracts.paiement jsonb`, `contracts.caution jsonb` (défaut `{}`), table `stripe_events(id text pk, type text, recu_le timestamptz)`, `fetch_contract_by_token` renvoie en plus `paiement: {status, mode, montant_cents, paid_at}` et `caution: {status, montant_cents, bloquee_le, expire_vers, retenu_cents}` ; job cron `caution-empreintes` (`7 * * * *`) qui POST `{"action":"cron"}` sur `<SUPABASE_URL>/functions/v1/paiement` avec l'en-tête `x-cron-secret` lu dans Vault (`cron_secret`).

- [ ] **Step 1: Write the migration** — `supabase/migrations/014_paiement_caution.sql`

```sql
-- 014 : paiement en ligne et caution par empreinte Stripe (spec 2026-10-04).
-- Etat ecrit par la fonction `paiement` (service role). Le locataire n'en voit qu'une
-- projection (statuts, montants, dates), jamais les identifiants Stripe.
-- A appliquer AVANT le deploiement de la fonction et le merge du frontend.
-- Prerequis : extensions pg_cron (deja active, 012) et pg_net ; secret Vault `cron_secret`
-- et `paiement_url` crees a la main (voir APPLY.md), jamais dans ce fichier.

alter table contracts add column if not exists paiement jsonb not null default '{}'::jsonb;
alter table contracts add column if not exists caution jsonb not null default '{}'::jsonb;

create table if not exists stripe_events (
  id text primary key,
  type text not null,
  recu_le timestamptz not null default now()
);
alter table stripe_events enable row level security;
-- Aucune policy : seule la fonction (service role) lit et ecrit.

create extension if not exists pg_net;
```

Puis **recopier intégralement** `fetch_contract_by_token` depuis `supabase/migrations/010_documents_signables.sql` (lignes 35 à ~105) dans 014, et ajouter dans le `jsonb_build_object` final, après `'created_at', c.created_at,` :

```sql
    -- Paiement et caution (014) : projection, jamais d'identifiant Stripe.
    'paiement', jsonb_build_object(
      'status',        coalesce(c.paiement->>'status', 'attente'),
      'mode',          c.paiement->>'mode',
      'montant_cents', c.paiement->'montant_cents',
      'paid_at',       c.paiement->>'paid_at'),
    'caution', jsonb_build_object(
      'status',        coalesce(c.caution->>'status', 'carte_manquante'),
      'mode',          coalesce(c.caution->>'mode', 'auto'),
      'montant_cents', c.caution->'montant_cents',
      'bloquee_le',    c.caution->>'bloquee_le',
      'expire_vers',   c.caution->>'expire_vers',
      'retenu_cents',  c.caution->'retenu_cents'),
```

et terminer le fichier par :

```sql
grant execute on function fetch_contract_by_token(text) to anon, authenticated;

-- Cron horaire (minute 7) : la fonction decide seule quoi faire (LOGIQUE.decisionCaution).
do $$
begin
  if exists (select 1 from cron.job where jobname = 'caution-empreintes') then
    perform cron.unschedule('caution-empreintes');
  end if;
  perform cron.schedule('caution-empreintes', '7 * * * *', $cmd$
    select net.http_post(
      url     := (select decrypted_secret from vault.decrypted_secrets where name = 'paiement_url'),
      headers := jsonb_build_object('Content-Type', 'application/json',
                   'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
      body    := '{"action":"cron"}'::jsonb)
  $cmd$);
end;
$$;
```

- [ ] **Step 2: Vérifier la migration sur une base locale**

Run (si Docker est disponible) :
```bash
supabase start && supabase db reset
psql "$(supabase status -o env | grep DB_URL | cut -d= -f2- | tr -d '"')" -c "select column_name from information_schema.columns where table_name='contracts' and column_name in ('paiement','caution');" -c "select jobname, schedule from cron.job;"
```
Expected : les deux colonnes ; `caution-empreintes | 7 * * * *` (et `purge-pieces-identite`).
Puis, dans le même psql :
```sql
insert into contracts(code,type,owner_email,payload,status,access_token)
values ('9999','presentiel','x@x','{"total":"650"}','signed',repeat('a',32));
select fetch_contract_by_token(repeat('a',32))->'caution', fetch_contract_by_token(repeat('a',32))->'paiement';
update contracts set caution='{"status":"bloquee","customer_id":"cus_X","payment_method_id":"pm_X","montant_cents":300000}' where code='9999';
select fetch_contract_by_token(repeat('a',32))::text like '%cus_X%' as fuite;
```
Expected : `{"status":"carte_manquante","mode":"auto",…}` ; `{"status":"attente",…}` ; `fuite = f`.
Sans Docker : exécuter ces mêmes requêtes dans le SQL Editor **d'un projet Supabase de test**, jamais sur la prod avant la Task 8.

- [ ] **Step 3: Documenter dans `supabase/APPLY.md`** — ajouter :

```markdown
## Lot paiement et caution Stripe (migration 014 + fonction `paiement`)

Ordre : 1) secrets Vault, 2) migration, 3) fonction + secrets, 4) webhook Stripe, 5) merge du front.

1. SQL Editor (compte de Romain) :
   `select vault.create_secret('<valeur aleatoire 32+ car.>', 'cron_secret');`
   `select vault.create_secret('https://bbjpjbviehsxshvzkvla.supabase.co/functions/v1/paiement', 'paiement_url');`
   Si `pg_net` est refuse : Database > Extensions > pg_net, puis relancer.
2. Coller `014_paiement_caution.sql`, Run. Verifier :
   `select jobname, schedule from cron.job;` -> caution-empreintes, 7 * * * *
   `select column_name from information_schema.columns where table_name='contracts' and column_name in ('paiement','caution');`
3. Edge Functions > New function `paiement` : coller `supabase/functions/paiement/index.ts`
   (`LANG=en_US.UTF-8 pbcopy < supabase/functions/paiement/index.ts`), **Verify JWT : off**
   (le webhook et le cron n'ont pas de JWT ; chaque action se controle elle-meme). Secrets :
   `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `CRON_SECRET` (= la valeur Vault).
4. Webhook Stripe vers `.../functions/v1/paiement?webhook=1`, evenements
   `checkout.session.completed`, `payment_intent.canceled`, `payment_intent.amount_capturable_updated`.
   Le `whsec_…` affiche va dans `STRIPE_WEBHOOK_SECRET`.
5. Merge du frontend.

Rollback : `select cron.unschedule('caution-empreintes');` ; rejouer `fetch_contract_by_token`
de 010 ; les colonnes et `stripe_events` peuvent rester (ignorees par l'ancien front).
Desactiver le webhook Stripe. Les empreintes actives se liberent depuis le dashboard Stripe.
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/014_paiement_caution.sql supabase/APPLY.md
git commit -m "feat(paiement): migration 014, colonnes paiement/caution, projection locataire, cron horaire"
```

---

### Task 3: Socle de la fonction (Stripe, Resend, contrôles d'accès, routage)

**Files:**
- Modify: `supabase/functions/paiement/index.ts` (après le bloc logique)

**Interfaces:**
- Consumes : `LOGIQUE` (Task 1), colonnes et `stripe_events` (Task 2).
- Produces (internes, utilisés par Tasks 4-5) :
  - `stripe(chemin, params?, idem?) → Promise<{ok, status, data}>` — POST form-encodé si `params`, GET sinon.
  - `envoyer(to, subject, html) → Promise<void>` (Resend, n'échoue jamais).
  - `estAdmin(req) → Promise<boolean>`.
  - `chargerContrat(where: {id?|token?}) → Promise<row|null>` (service role, colonnes `id,code,status,vehicle,access_token,payload,paiement,caution`).
  - `majContrat(id, {paiement?, caution?}) → Promise<void>`.
  - `json(body, status) → Response`.

- [ ] **Step 1: Ajouter le socle** à la suite du bloc logique :

```ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  const data = await r.json();
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
const COLS = "id,code,status,vehicle,access_token,payload,paiement,caution";
async function chargerContrat(w: { id?: string; token?: string }) {
  if (w.token !== undefined && (typeof w.token !== "string" || w.token.length < 24)) return null;
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
```

Ajouter des **stubs temporaires** en bas du fichier pour que le module se charge :
```ts
async function actionWebhook(_req: Request): Promise<Response> { return json({ error: "non implémenté" }, 501); }
async function actionCheckout(_b: Record<string, unknown>): Promise<Response> { return json({ error: "non implémenté" }, 501); }
async function actionAdmin(_b: Record<string, unknown>): Promise<Response> { return json({ error: "non implémenté" }, 501); }
async function actionCron(): Promise<Response> { return json({ error: "non implémenté" }, 501); }
```

- [ ] **Step 2: Vérifier**

Run: `node web/paiement-logique.test.js && (command -v deno >/dev/null && deno check supabase/functions/paiement/index.ts || echo "deno absent : verification de typage en Task 8 au deploiement")`
Expected : `paiement-logique : OK`, puis `Check …` sans erreur (ou le message deno absent).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/paiement/index.ts
git commit -m "feat(paiement): socle de la fonction (Stripe, Resend, controle admin, routage)"
```

---

### Task 4: Actions `checkout` (locataire) et `webhook` (Stripe)

**Files:**
- Modify: `supabase/functions/paiement/index.ts` (remplacer les stubs `actionCheckout` et `actionWebhook`)

**Interfaces:**
- Consumes : `LOGIQUE.peutLancerCheckout`, `LOGIQUE.euroEnCentimes`, `LOGIQUE.verifierSignatureStripe`, `LOGIQUE.traiterEvenement`, socle Task 3.
- Produces : `POST {action:'checkout', token}` → `{url}` (200) | `{error}` (400/404) ; `POST ?webhook=1` → 200 `{recu:true}` | 400.

- [ ] **Step 1: Implémenter `actionCheckout`**

```ts
async function actionCheckout(b: Record<string, unknown>): Promise<Response> {
  const c = await chargerContrat({ token: String(b.token || "") });
  if (!c) return json({ error: "Lien invalide." }, 404);
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
```

- [ ] **Step 2: Implémenter `actionWebhook`**

```ts
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
```

- [ ] **Step 3: Vérifier**

Run: `node web/paiement-logique.test.js && (command -v deno >/dev/null && deno check supabase/functions/paiement/index.ts || true)`
Expected : OK. Le test bout-en-bout de ces actions se fait en Task 8 (mode test Stripe).

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/paiement/index.ts
git commit -m "feat(paiement): checkout locataire (paiement ou carte seule) et webhook Stripe idempotent"
```

---

### Task 5: Actions `admin` (Romain) et `cron` (empreintes automatiques)

**Files:**
- Modify: `supabase/functions/paiement/index.ts` (remplacer les stubs `actionAdmin` et `actionCron`)

**Interfaces:**
- Consumes : `LOGIQUE.decisionCaution`, `LOGIQUE.validerRetenue`, `LOGIQUE.euroEnCentimes`, socle Task 3.
- Produces : `POST {action:'admin', op, contract_id, …}` avec `op` ∈ `marquer_paye {mode}` | `annuler_paye` | `caution_manuelle {actif:boolean}` | `poser` | `liberer` | `retenir {montant_cents}` → `{ok:true, paiement, caution}` | `{error}` 400 ; `POST {action:'cron'}` → `{traites:n}`. Fonction interne `poserEmpreinte(c, n) → Promise<{ok, motif?}>`.

- [ ] **Step 1: Implémenter `poserEmpreinte`, `actionCron`, `actionAdmin`**

```ts
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
    if (ancien) await stripe(`payment_intents/${ancien}/cancel`, { cancellation_reason: "requested_by_customer" });
    if (!ancien) await envoyer(ROMAIN_EMAIL, `Caution bloquée — contrat #${c.code}`, `<p>Empreinte de ${euros(montant)} posée pour ${esc(nomLocataire(c.payload || {}))}.</p>`);
    return { ok: true };
  }
  const motif = r.data?.error?.decline_code || r.data?.error?.code || r.data?.status || "inconnu";
  const echecs = (cau.echecs || 0) + 1;
  // Un renouvellement rate laisse l'ancienne empreinte active : on ne la marque pas en echec.
  const status = cau.status === "bloquee" ? "bloquee" : "echec";
  await majContrat(c.id, { caution: { ...cau, status, echecs, dernier_motif: motif, historique } });
  await envoyer(ROMAIN_EMAIL, `⚠️ Caution non bloquée — contrat #${c.code}`, `<p>L'empreinte de ${euros(montant)} pour ${esc(nomLocataire(c.payload || {}))} a échoué (${esc(motif)}), tentative ${echecs}/3. Ouvrez « Mes contrats » pour réessayer ou gérer la caution autrement.</p>`);
  return { ok: false, motif };
}

async function actionCron(): Promise<Response> {
  const { data } = await db.from("contracts").select(COLS).eq("status", "signed").neq("caution->>mode", "manuel").not("caution->>payment_method_id", "is", null);
  let traites = 0;
  const now = new Date();
  for (const c of data || []) {
    const d = LOGIQUE.decisionCaution({ ...c, retourFait: await retourFait(c.id) }, now);
    if (d === "poser" || d === "renouveler") { await poserEmpreinte(c); traites++; }
  }
  // Spec §7 : un contrat annule ne garde jamais d'empreinte active.
  const { data: annules } = await db.from("contracts").select(COLS).eq("status", "cancelled").eq("caution->>status", "bloquee");
  for (const c of annules || []) {
    const r = await stripe(`payment_intents/${c.caution.payment_intent_id}/cancel`, { cancellation_reason: "abandoned" });
    if (r.ok) { await majContrat(c.id, { caution: { ...c.caution, status: "liberee", libere_le: now.toISOString() } }); traites++; }
  }
  return json({ traites });
}

async function actionAdmin(b: Record<string, any>): Promise<Response> {
  const c = await chargerContrat({ id: String(b.contract_id || "") });
  if (!c) return json({ error: "Contrat introuvable." }, 404);
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
      if (b.actif && cau.status === "bloquee") return json({ error: "Libérez d'abord l'empreinte active." }, 400);
      await majContrat(c.id, { caution: { ...cau, mode: b.actif ? "manuel" : "auto", status: b.actif ? "manuel" : (cau.payment_method_id ? "carte_ok" : "carte_manquante") } });
      break;
    case "poser": {
      if (cau.mode === "manuel") return json({ error: "Caution gérée hors ligne." }, 400);
      const r = await poserEmpreinte({ ...c, caution: cau.status === "echec" ? { ...cau, echecs: 0 } : cau });
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
```

- [ ] **Step 2: Vérifier**

Run: `node web/paiement-logique.test.js && grep -c "non implémenté" supabase/functions/paiement/index.ts`
Expected : `paiement-logique : OK` puis `0` (plus aucun stub).

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/paiement/index.ts
git commit -m "feat(paiement): actions de Romain (payé, hors ligne, poser, libérer, retenir) et cron des empreintes"
```

---

### Task 6: Front locataire (mode en ligne + bloc paiement après signature)

**Files:**
- Modify: `web/app/index.html` — étape paiement `#lc2` (≈ l. 1340-1352), message de succès `#loc_success` (≈ l. 1381), chargement par token (≈ l. 3160-3210), envoi de la signature `envLocSig` (≈ l. 3784-3795).
- Test: `web/paiement-front.test.js`

**Interfaces:**
- Consumes : `fetch_contract_by_token` → `row.paiement`, `row.caution` (Task 2) ; `POST paiement {action:'checkout', token}` → `{url}|{error}` (Task 4).
- Produces : fonction pure `blocPaiementLocataire(row) → {visible, titre, bouton, info}` (bloc marqué `PAIEMENT LOCATAIRE (debut/fin)`), `afficherBlocPaiement(row)`, `lancerCheckout()`.

- [ ] **Step 1: Write the failing test** — `web/paiement-front.test.js`

```js
/* Bloc « PAIEMENT LOCATAIRE » de web/app/index.html. Lancer : node web/paiement-front.test.js */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');
const m = html.match(/\/\/ ── PAIEMENT LOCATAIRE \(debut\) ──\n([\s\S]*?)\/\/ ── PAIEMENT LOCATAIRE \(fin\) ──/);
assert.ok(m, 'bloc PAIEMENT LOCATAIRE introuvable');
const ctx = {}; vm.createContext(ctx); vm.runInContext(m[1] + '\nthis.f = blocPaiementLocataire;', ctx);
const f = ctx.f;
const row = (paiements, pai, cau, status = 'signed') => ({ status, payload: { paiements, total: '650', caution: '3000' }, paiement: pai, caution: cau });

let b = f(row(['Carte bancaire en ligne'], { status: 'attente' }, { status: 'carte_manquante', mode: 'auto' }));
assert.strictEqual(b.visible, true);
assert.match(b.bouton, /Payer 650,00\s€ et enregistrer ma carte/);
b = f(row(['Virement bancaire'], { status: 'attente' }, { status: 'carte_manquante', mode: 'auto' }));
assert.match(b.bouton, /Enregistrer ma carte pour la caution de 3\s000,00\s€/);
assert.match(b.info, /aucun débit/i);
b = f(row(['Virement bancaire'], { status: 'attente' }, { status: 'echec', mode: 'auto' }));
assert.strictEqual(b.visible, true, 'carte en echec : reenregistrement possible');
b = f(row(['Carte bancaire en ligne'], { status: 'paye_en_ligne' }, { status: 'carte_ok', mode: 'auto' }));
assert.strictEqual(b.visible, false);
assert.match(b.info, /Payé/);
b = f(row(['Virement bancaire'], { status: 'attente' }, { status: 'manuel', mode: 'manuel' }));
assert.strictEqual(b.visible, false);
b = f(row(['Virement bancaire'], { status: 'attente' }, { status: 'carte_manquante' }, 'pending'));
assert.strictEqual(b.visible, false, 'pas avant la signature');
console.log('paiement-front : OK');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node web/paiement-front.test.js`
Expected: FAIL `bloc PAIEMENT LOCATAIRE introuvable`

- [ ] **Step 3: Implement**

3a. Dans `#lc2`, ajouter la carte en tête de `.pay-grid` (avant `locp_virement`) et remplacer le texte d'aide :
```html
      <div class="alert a-info">Choisissez votre mode de paiement. Dans tous les cas, votre carte sera enregistrée pour la caution (empreinte bloquée la veille du départ, débitée seulement en cas de dommage).</div>
      <div class="pay-grid">
        <div class="pcard" id="locp_enligne" onclick="locTogPay('Carte bancaire en ligne')"><div class="picon" aria-hidden="true">💳</div><div><div class="plbl">Carte bancaire en ligne</div><div class="psub">Paiement immédiat, sécurisé par Stripe</div></div><div class="pchk" id="locpc_enligne"></div></div>
```
Vérifier dans `locTogPay` (≈ l. 2969) la table de correspondance des identifiants (`const map={…}`) et y ajouter `'cartebancaireenligne':'enligne'` pour que la coche s'affiche.

3b. Après `#loc_success`, ajouter le bloc (rôle `region`, annonce par le `role="status"` existant) :
```html
      <section class="alert a-info" id="loc_paiement" aria-labelledby="loc_paiement_titre" style="display:none;margin-top:11px">
        <h3 id="loc_paiement_titre" style="margin:0 0 6px;font-size:15px"></h3>
        <p id="loc_paiement_info" style="margin:0 0 9px"></p>
        <button class="btn btn-p" id="loc_paiement_btn" style="width:100%" onclick="lancerCheckout()"></button>
        <p class="alert a-err" id="loc_paiement_err" role="alert" style="display:none;margin-top:9px"></p>
      </section>
```

3c. Dans le `<script>`, près de `fetchContractByToken` :
```js
// ── PAIEMENT LOCATAIRE (debut) ──
function blocPaiementLocataire(row){
  const eur=c=>(c/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
  const cents=v=>{const s=String(v??'').replace(/\s/g,'').replace(',','.');return /^\d+(\.\d{1,2})?$/.test(s)?Math.round(Number(s)*100):0;};
  const p=row.payload||{},pai=row.paiement||{},cau=row.caution||{};
  const enLigne=(p.paiements||[]).indexOf('Carte bancaire en ligne')>=0;
  const paye=pai.status==='paye_en_ligne'||pai.status==='paye_manuel';
  const carteOk=['carte_ok','bloquee','liberee','retenue','manuel'].indexOf(cau.status)>=0||cau.mode==='manuel';
  const etatPaiement=paye?'Payé ✓':(enLigne?'Paiement en ligne à faire':'Paiement attendu : '+(p.paiements||[]).join(', '));
  const etatCaution=cau.mode==='manuel'?'Caution gérée directement avec RB-CapSO':
    cau.status==='bloquee'?'Caution de '+eur(cau.montant_cents||cents(p.caution))+' bloquée ✓':
    carteOk?'Carte enregistrée ✓ — caution de '+eur(cents(p.caution))+' bloquée la veille du départ':'Carte pour la caution à enregistrer';
  const info=etatPaiement+' · '+etatCaution;
  if(row.status!=='signed'||(paye||!enLigne)&&carteOk)return{visible:false,titre:'',bouton:'',info};
  if(enLigne&&!paye)return{visible:true,titre:'Dernière étape : le paiement',bouton:'Payer '+eur(cents(p.total))+' et enregistrer ma carte pour la caution',info};
  return{visible:true,titre:'Dernière étape : la carte pour la caution',bouton:'Enregistrer ma carte pour la caution de '+eur(cents(p.caution)),info:info+'. Aucun débit : la carte sert uniquement à l’empreinte de caution.'};
}
// ── PAIEMENT LOCATAIRE (fin) ──
function afficherBlocPaiement(row){
  const b=blocPaiementLocataire(row),s=g('loc_paiement');if(!s)return;
  g('loc_paiement_titre').textContent=b.visible?b.titre:'Paiement et caution';
  g('loc_paiement_info').textContent=b.info;
  const btn=g('loc_paiement_btn');btn.textContent=b.bouton;btn.style.display=b.visible?'':'none';
  s.style.display='block';
}
async function lancerCheckout(){
  const btn=g('loc_paiement_btn'),err=g('loc_paiement_err');
  btn.setAttribute('aria-disabled','true');err.style.display='none';
  try{
    const {data,error}=await sb.functions.invoke('paiement',{body:{action:'checkout',token:locToken}});
    if(error||!data?.url){
      let msg=data?.error;
      try{msg=msg||(await error?.context?.json())?.error;}catch(_){}
      throw new Error(msg||'Paiement indisponible, réessayez dans un instant.');
    }
    location.href=data.url;
  }catch(e){err.textContent=e.message;err.style.display='block';btn.removeAttribute('aria-disabled');}
}
```

3d. Après une signature réussie dans `envLocSig` (juste après `g('loc_success').classList.add('show');`) :
```js
    const frais=await fetchContractByToken(locToken);if(frais)afficherBlocPaiement(frais);
```

3e. Au chargement par token (≈ l. 3170, branche « Déjà signé ») : appeler `afficherBlocPaiement(row)` pour que le locataire qui rouvre son lien retrouve le bloc. Si `params.get('stripe')==='ok'` et que le statut n'est pas encore à jour, afficher dans `#loc_paiement_info` « Paiement en cours de confirmation… » et relire le contrat toutes les 3 s, 5 fois au plus, puis rappeler `afficherBlocPaiement`. Si `params.get('stripe')==='annule'`, afficher dans `#loc_paiement_err` « Paiement annulé : vous pouvez recommencer quand vous voulez. ».

- [ ] **Step 4: Run tests**

Run: `node web/paiement-front.test.js && for f in web/*.test.js; do node "$f" || exit 1; done`
Expected : tous OK.

- [ ] **Step 5: Vérification visuelle** — servir `web/` (`python3 -m http.server 8765 --directory web`) et ouvrir `/app/?t=<token de test>` d'un contrat de test (Task 8) au clavier : la carte « Carte bancaire en ligne » est sélectionnable à l'espace/entrée comme les autres, le bloc apparaît après signature, le message d'erreur est annoncé.

- [ ] **Step 6: Commit**

```bash
git add web/app/index.html web/paiement-front.test.js
git commit -m "feat(paiement): mode carte en ligne et bloc paiement/caution pour le locataire"
```

---

### Task 7: Front admin (pastilles et actions dans « Mes contrats », écran Retour)

**Files:**
- Modify: `web/app/index.html` — `listContracts` (≈ l. 1514, colonnes sélectionnées), `renderContractCard` (≈ l. 1600), sauvegarde du retour (≈ l. 2655-2670), CSS (bloc `<style>` principal).
- Test: `web/paiement-front.test.js` (ajouts)

**Interfaces:**
- Consumes : colonnes `paiement`, `caution` (Task 2) ; `POST paiement {action:'admin', op, contract_id, …}` (Task 5).
- Produces : fonction pure `pastillesPaiement(c) → {paiement:{texte, ton}, caution:{texte, ton}, actions:string[]}` (bloc `PASTILLES ADMIN (debut/fin)`) ; `opPaiement(c, op, extra)`.

- [ ] **Step 1: Write the failing test** — ajouter à `web/paiement-front.test.js` avant le `console.log` :

```js
const m2 = html.match(/\/\/ ── PASTILLES ADMIN \(debut\) ──\n([\s\S]*?)\/\/ ── PASTILLES ADMIN \(fin\) ──/);
assert.ok(m2, 'bloc PASTILLES ADMIN introuvable');
const ctx2 = {}; vm.createContext(ctx2); vm.runInContext(m2[1] + '\nthis.f = pastillesPaiement;', ctx2);
const P = ctx2.f;
const C = (pai, cau, payload = { paiements: ['Virement bancaire'], caution: '3000' }) => ({ status: 'signed', payload, paiement: pai, caution: cau });
let r = P(C({ status: 'attente' }, { status: 'carte_manquante', mode: 'auto' }));
assert.strictEqual(r.paiement.texte, 'En attente (Virement bancaire)');
assert.strictEqual(r.caution.texte, 'Carte manquante');
assert.deepStrictEqual([...r.actions].sort(), ['caution_manuelle', 'marquer_paye']);
r = P(C({ status: 'paye_en_ligne' }, { status: 'bloquee', mode: 'auto', expire_vers: '2026-10-14T10:00:00Z', montant_cents: 300000 }));
assert.strictEqual(r.paiement.texte, 'Payé en ligne ✓');
assert.match(r.caution.texte, /^Bloquée jusqu’au 14\/10/);
assert.deepStrictEqual([...r.actions].sort(), ['liberer', 'retenir']);
r = P(C({ status: 'paye_manuel', mode: 'Espèces' }, { status: 'echec', mode: 'auto', dernier_motif: 'insufficient_funds', echecs: 3 }));
assert.strictEqual(r.paiement.texte, 'Payé (déclaré, Espèces)');
assert.strictEqual(r.caution.ton, 'alerte');
assert.ok(r.actions.includes('poser') && r.actions.includes('annuler_paye') && r.actions.includes('caution_manuelle'));
r = P(C({}, { status: 'retenue', mode: 'auto', retenu_cents: 45000 }));
assert.match(r.caution.texte, /^Retenue 450,00\s€$/);
r = P(C({}, { status: 'manuel', mode: 'manuel' }));
assert.strictEqual(r.caution.texte, 'Gérée hors ligne');
assert.ok(r.actions.includes('caution_auto'));
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node web/paiement-front.test.js`
Expected: FAIL `bloc PASTILLES ADMIN introuvable`

- [ ] **Step 3: Implement**

3a. `listContracts` : ajouter `,paiement,caution` à la liste du `select(...)`.

3b. Fonction pure + actions, près de `renderContractCard` :
```js
// ── PASTILLES ADMIN (debut) ──
function pastillesPaiement(c){
  const eur=x=>(x/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'});
  const jm=iso=>{const d=new Date(iso);return isNaN(d)?'?':String(d.getUTCDate()).padStart(2,'0')+'/'+String(d.getUTCMonth()+1).padStart(2,'0');};
  const p=c.payload||{},pai=c.paiement||{},cau=c.caution||{};
  const actions=[];
  let paiement;
  if(pai.status==='paye_en_ligne')paiement={texte:'Payé en ligne ✓',ton:'ok'};
  else if(pai.status==='paye_manuel'){paiement={texte:'Payé (déclaré, '+(pai.mode||'hors ligne')+')',ton:'ok'};actions.push('annuler_paye');}
  else{paiement={texte:'En attente ('+((p.paiements||[]).join(', ')||'mode non choisi')+')',ton:'attente'};actions.push('marquer_paye');}
  let caution;
  const st=cau.mode==='manuel'?'manuel':(cau.status||'carte_manquante');
  if(st==='manuel'){caution={texte:'Gérée hors ligne',ton:'neutre'};actions.push('caution_auto');}
  else if(st==='carte_manquante'){caution={texte:'Carte manquante',ton:'attente'};actions.push('caution_manuelle');}
  else if(st==='carte_ok'){caution={texte:'Carte enregistrée',ton:'attente'};actions.push('poser','caution_manuelle');}
  else if(st==='bloquee'){caution={texte:'Bloquée jusqu’au '+jm(cau.expire_vers)+' ('+eur(cau.montant_cents||0)+')',ton:'ok'};actions.push('liberer','retenir');}
  else if(st==='liberee')caution={texte:'Libérée',ton:'neutre'};
  else if(st==='retenue')caution={texte:'Retenue '+eur(cau.retenu_cents||0),ton:'neutre'};
  else if(st==='echec'){caution={texte:'⚠️ Échec ('+(cau.dernier_motif||'refus')+', '+(cau.echecs||1)+'/3)',ton:'alerte'};actions.push('poser','caution_manuelle');}
  else caution={texte:st,ton:'neutre'};
  return{paiement,caution,actions};
}
// ── PASTILLES ADMIN (fin) ──
const LIB_OP={marquer_paye:'Marquer payé',annuler_paye:'Annuler « payé »',caution_manuelle:'Caution gérée hors ligne',caution_auto:'Revenir à l’empreinte automatique',poser:'Poser l’empreinte maintenant',liberer:'Libérer la caution',retenir:'Retenir un montant'};
async function opPaiement(c,op){
  const body={action:'admin',op,contract_id:c.id};
  if(op==='marquer_paye'){const mode=prompt('Mode de paiement reçu ?',(c.payload?.paiements||[])[0]||'Virement bancaire');if(!mode)return;body.mode=mode;}
  if(op==='caution_manuelle'||op==='caution_auto'){body.op='caution_manuelle';body.actif=op==='caution_manuelle';}
  if(op==='retenir'){
    const max=(c.caution?.montant_cents||0)/100;
    const s=prompt('Montant à retenir (€, au plus '+max+' €) :');if(!s)return;
    const cents=Math.round(Number(String(s).replace(/\s/g,'').replace(',','.'))*100);
    if(!confirm('Retenir '+(cents/100).toLocaleString('fr-FR',{style:'currency',currency:'EUR'})+' sur la carte du locataire ? Le reste sera libéré. Action définitive.'))return;
    body.montant_cents=cents;
  }
  if(op==='liberer'&&!confirm('Libérer la caution de '+(((c.caution?.montant_cents)||0)/100)+' € ?'))return;
  const {data,error}=await sb.functions.invoke('paiement',{body});
  if(error||!data?.ok){let msg=data?.error;try{msg=msg||(await error?.context?.json())?.error;}catch(_){}alert(msg||'Action impossible.');return;}
  c.paiement=data.paiement;c.caution=data.caution;
  if(typeof loadContracts==='function')loadContracts();
}
```
(Vérifier le nom réel de la fonction qui recharge la liste « Mes contrats » — chercher l'appelant de `listContracts` — et l'utiliser à la place de `loadContracts`.)

3c. Dans `renderContractCard`, après `if(datesEl)info.appendChild(datesEl);` et seulement si `c.type!=='retour'` :
```js
  if(c.status==='signed'||c.status==='completed'){
    const pp=pastillesPaiement(c);
    const ligne=document.createElement('div');ligne.className='pastilles-paiement';
    for(const [lib,x] of [['Paiement',pp.paiement],['Caution',pp.caution]]){
      const s=document.createElement('span');s.className='pastille pastille-'+x.ton;s.textContent=lib+' : '+x.texte;ligne.appendChild(s);
    }
    info.appendChild(ligne);
    if(pp.actions.length){
      const sel=document.createElement('select');sel.className='cact-select';sel.setAttribute('aria-label','Paiement et caution de '+locName);
      sel.appendChild(new Option('💳 Paiement / caution…',''));
      pp.actions.forEach(op=>sel.appendChild(new Option(LIB_OP[op],op)));
      sel.onchange=()=>{const op=sel.value;sel.value='';if(op)opPaiement(c,op);};
      info.appendChild(sel);
    }
  }
```

3d. CSS (bloc `<style>` principal) — contrastes ≥ 4,5:1 :
```css
.pastilles-paiement{display:flex;flex-wrap:wrap;gap:6px;margin-top:4px}
.pastille{font-size:11px;padding:2px 8px;border-radius:999px;border:1px solid currentColor}
.pastille-ok{color:#1d6b20;background:#eef8ee}
.pastille-attente{color:#8a4b00;background:#fff4e5}
.pastille-alerte{color:#a11a1a;background:#fdecec;font-weight:600}
.pastille-neutre{color:#4a4a4a;background:#f3f3f3}
.cact-select{margin-top:6px;font-size:12px;padding:4px 6px;border-radius:6px}
```

3e. Écran Retour : dans la sauvegarde (≈ l. 2659, après l'`insertContract` du retour réussi), si le contrat parent a une empreinte active :
```js
        const parent=await sb.from('contracts').select('id,code,payload,paiement,caution').eq('id',retourParentId).maybeSingle();
        if(parent.data?.caution?.status==='bloquee'){
          await opPaiement(parent.data,g('rcaut_rest').checked?'liberer':'retenir');
        }
```
(`opPaiement` demande confirmation : rien ne part sans clic.)

- [ ] **Step 4: Run tests**

Run: `node web/paiement-front.test.js && for f in web/*.test.js; do node "$f" || exit 1; done`
Expected : tous OK.

- [ ] **Step 5: Commit**

```bash
git add web/app/index.html web/paiement-front.test.js
git commit -m "feat(paiement): pastilles et actions paiement/caution pour Romain, liaison avec l'écran Retour"
```

---

### Task 8: Mise en service en mode test Stripe et recette bout en bout

**Files:**
- Modify: `supabase/APPLY.md` (compte rendu de recette à la fin de la section du lot)

**Interfaces:**
- Consumes : tout ce qui précède.

- [ ] **Step 1: Clés et webhook de test** (compte RB-CapSO, mode test, profil CLI `rbcapso`) :
```bash
stripe --project-name rbcapso webhook_endpoints create \
  --url "https://bbjpjbviehsxshvzkvla.supabase.co/functions/v1/paiement?webhook=1" \
  -d "enabled_events[]=checkout.session.completed" \
  -d "enabled_events[]=payment_intent.canceled" \
  -d "enabled_events[]=payment_intent.amount_capturable_updated"
```
Noter le `secret` (`whsec_…`) affiché. La clé `sk_test_…` se lit dans le dashboard Stripe (Développeurs > Clés API, mode test). Ne jamais les écrire dans un fichier du dépôt.

- [ ] **Step 2: Appliquer** les étapes 1 à 4 de la section APPLY.md (Task 2) **avec les clés de test** : Vault, migration, fonction (verify JWT off), secrets. L'application en prod de la migration et de la fonction suit la règle CRITIQUE du skill ship (revue avant/pendant/après).

- [ ] **Step 3: Recette — contrat de test** créé dans `/app` (véhicule tente, caution 500 €, départ demain matin), lien de signature ouvert en navigation privée :

| # | Scénario | Carte de test | Attendu |
|---|---|---|---|
| 1 | Mode « Carte bancaire en ligne », signer, payer | `4242 4242 4242 4242` | Retour `stripe=ok`, bloc « Payé ✓ · Carte enregistrée ✓ » ; pastilles « Payé en ligne ✓ » / « Carte enregistrée » ; emails Romain + locataire. |
| 2 | Lancer le cron : `select net.http_post(...)` du job, ou attendre la minute 7 | — | Pastille « Bloquée jusqu’au … », PI `requires_capture` dans Stripe (test). |
| 3 | Retenir 120 € | — | Stripe : capture 120 €, reste libéré ; pastille « Retenue 120,00 € » ; email locataire. |
| 4 | Nouveau contrat, mode « Virement », signer, enregistrer la carte | `4000 0025 0000 3155` (3D Secure) | Checkout en mode setup, aucun débit ; « En attente (Virement bancaire) » ; « Marquer payé » → « Payé (déclaré, Virement bancaire) ». |
| 5 | Poser l'empreinte du contrat 4 | (carte 3DS enregistrée) | Échec possible `authentication_required` → pastille « ⚠️ Échec », email Romain ; « Caution gérée hors ligne » → « Gérée hors ligne ». |
| 6 | Contrat avec carte `4000 0000 0000 0341` puis poser | `4000 0000 0000 0341` | Carte enregistrée, empreinte refusée (`card_declined`), 3 tentatives max puis arrêt. |
| 7 | Rejouer un webhook depuis le dashboard Stripe | — | Réponse 200 `doublon:true`, état inchangé. |
| 8 | Recharger le lien locataire d'un contrat payé | — | Plus de bouton de paiement. |
| 9 | Libérer une empreinte active | — | « Libérée », PI `canceled` dans Stripe, email locataire. |

- [ ] **Step 4: Consigner** dans `supabase/APPLY.md`, à la suite de la section du lot : date, mode test, résultat de chaque scénario, identifiants des contrats de test supprimés ensuite.

- [ ] **Step 5: Commit**

```bash
git add supabase/APPLY.md
git commit -m "docs(paiement): procédure de mise en service et recette en mode test Stripe"
```

- [ ] **Step 6: Bascule live** (après merge et accord sur la recette) : créer le même webhook en `--live`, remplacer `STRIPE_SECRET_KEY` (`sk_live_…`, dashboard) et `STRIPE_WEBHOOK_SECRET` dans les secrets Supabase, sans redéploiement. Faire un vrai paiement de bout en bout sur la tente (petit total), puis le rembourser depuis le dashboard Stripe et libérer l'empreinte.
