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
const row = (paiements, pai, cau, status = 'signed') => ({ type: 'presentiel', status, payload: { paiements, total: '650', caution: '3000' }, paiement: pai, caution: cau });

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
b = f({ ...row(['Virement bancaire'], { status: 'attente' }, { status: 'carte_manquante', mode: 'auto' }), type: 'edl_depart' });
assert.strictEqual(b.visible, false, 'pas sur un lien d EDL');
b = f({ ...row(['Virement bancaire'], { status: 'attente' }, { status: 'carte_manquante', mode: 'auto' }), payload: { paiements: ['Virement bancaire'], total: '650' } });
assert.strictEqual(b.bouton, 'Enregistrer ma carte pour la caution', 'sans montant de caution : pas de 0,00 €');
assert.ok(!/0,00/.test(b.bouton + b.info));
// locTogPay : le slug est tronque a 8 caracteres, la table map doit contenir carteban
assert.match(html, /const map=\{[^}]*carteban:'enligne'/, 'map locTogPay sans carteban');
assert.ok(html.includes('id="locp_enligne"') && html.includes('id="locpc_enligne"'));
assert.strictEqual('Carte bancaire en ligne'.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8), 'carteban');
console.log('paiement-front : OK');
