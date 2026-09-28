/*
 * Verification du prix recalcule quand le locataire change ses dates ou ses
 * creneaux sur le lien de signature (web/app/index.html, bloc « PRIX LOCATAIRE »).
 * Lancer:  node web/prix-locataire.test.js
 *
 * Zero dependance, comme le reste du projet.
 *
 * Bug du 27/09/2026 (Romain) : passer le retour du matin a l'apres-midi ne
 * changeait pas le prix. La base refait le meme calcul a la signature
 * (supabase/migrations/013_prix_selon_dates.sql, recalcul_prix_locataire) ; les
 * cas ci-dessous ont ete joues a l'identique contre cette fonction SQL.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'app', 'index.html'), 'utf8');
const sql = fs.readFileSync(path.join(__dirname, '..', 'supabase', 'migrations', '013_prix_selon_dates.sql'), 'utf8');
const plain = (x) => JSON.parse(JSON.stringify(x));

function extraire(debut, fin) {
  const a = html.indexOf(debut), b = html.indexOf(fin);
  assert(a !== -1 && b > a, 'bloc introuvable : ' + debut);
  return html.slice(a, b + fin.length);
}
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  extraire('// ═══ TARIF PARTAGÉ (début) ═══', '// ═══ TARIF PARTAGÉ (fin) ═══') + '\n' +
  extraire('// ═══ PRIX LOCATAIRE (début) ═══', '// ═══ PRIX LOCATAIRE (fin) ═══') +
  '\nthis.joursLocation=joursLocation;this.prixSelonDates=prixSelonDates;this.calculerEstimation=calculerEstimation;this.TARIF=TARIF;this.PRIX_FIXES=PRIX_FIXES;',
  ctx
);
const { joursLocation, prixSelonDates, calculerEstimation, TARIF, PRIX_FIXES } = ctx;

let echecs = 0;
function cas(nom, fn) {
  try { fn(); console.log('ok   ' + nom); }
  catch (e) { echecs++; console.log('FAIL ' + nom + '\n     ' + e.message); }
}

const MATIN = 'Matin (avant 14h)', APREM = 'Après-midi (après 14h)';

// Contrat présentiel tel que collectC l'enregistre : 3 jours à 100 €, forfait
// 200 km (15 €/j), paddle (10 €/j), kit linge (25 € fixe), assurance 30 €, frais 70 €.
function contrat(jours) {
  const e = calculerEstimation({ jours, prix_jour: 100, forfait: '200 km/jour', options: ['paddle', 'linge'], frais_service: 70, assurance: 30 });
  return plain({ pj: '100', red: '20', forfait_extra: 15, lignes: e.lignes, total: String(e.total_cents / 100 - 20) });
}

cas('durée : départ matin, retour après-midi = jours calendaires', () => {
  assert.strictEqual(joursLocation('01/10/2026', MATIN, '03/10/2026', APREM), 3);
});
cas('durée : départ après-midi et retour matin retirent une demi-journée chacun', () => {
  assert.strictEqual(joursLocation('01/10/2026', APREM, '03/10/2026', APREM), 2.5);
  assert.strictEqual(joursLocation('01/10/2026', APREM, '03/10/2026', MATIN), 2);
  assert.strictEqual(joursLocation('01/10/2026', APREM, '01/10/2026', MATIN), 0.5);
});
cas('durée : dates absentes ou inversées = 0', () => {
  assert.strictEqual(joursLocation('', MATIN, '03/10/2026', APREM), 0);
  assert.strictEqual(joursLocation('05/10/2026', MATIN, '03/10/2026', APREM), 0);
});
cas('durée : passage à l\'heure d\'hiver sans effet', () => {
  assert.strictEqual(joursLocation('24/10/2026', MATIN, '26/10/2026', APREM), 3);
});

cas('bug Romain : retour matin → après-midi augmente le prix', () => {
  const d = { ...contrat(2.5), debut: '01/10/2026', debut_h: MATIN, fin: '03/10/2026', fin_h: APREM };
  const p = prixSelonDates(d);
  assert(p, 'le prix doit être recalculé');
  const attendu = calculerEstimation({ jours: 3, prix_jour: 100, forfait: '200 km/jour', options: ['paddle', 'linge'], frais_service: 70, assurance: 30 });
  assert.deepStrictEqual(plain(p.lignes), plain(attendu.lignes));
  assert.strictEqual(p.total, String(attendu.total_cents / 100 - 20));
  assert.strictEqual(p.duree, '3 j');
  // sous-total = hors frais de service et assurance
  assert.strictEqual(p.stot, String((attendu.total_cents - 7000 - 3000) / 100));
});
cas('créneaux inchangés : rien à recalculer', () => {
  const d = { ...contrat(3), debut: '01/10/2026', debut_h: MATIN, fin: '03/10/2026', fin_h: APREM };
  assert.strictEqual(prixSelonDates(d), null);
});
cas('frais, assurance et kit linge ne dépendent pas de la durée', () => {
  const d = { ...contrat(3), debut: '01/10/2026', debut_h: APREM, fin: '01/10/2026', fin_h: MATIN };
  const p = prixSelonDates(d);
  const par = (id) => p.lignes.find((l) => l.id === id).cents;
  assert.strictEqual(par('service'), 7000);
  assert.strictEqual(par('assurance'), 3000);
  assert.strictEqual(par('linge'), 2500);
  assert.strictEqual(par('location'), 5000);
  assert.strictEqual(par('forfait'), 750);
  assert.strictEqual(par('paddle'), 500);
  assert.strictEqual(p.lignes.find((l) => l.id === 'location').l, '0.5 jour × 100 €');
  assert.strictEqual(p.duree, '0.5 j');
});
cas('prix/jour à centimes : arrondi au centime', () => {
  const e = calculerEstimation({ jours: 3, prix_jour: 86.67 });
  const d = plain({ pj: '86.67', lignes: e.lignes, debut: '01/10/2026', debut_h: APREM, fin: '04/10/2026', fin_h: APREM });
  const p = prixSelonDates(d);
  assert.strictEqual(p.lignes[0].cents, 30335); // 3,5 × 86,67 = 303,345
  assert.strictEqual(p.lignes[0].l, '3.5 jours × 86.67 €');
});
cas('réduction plus forte que le total : 0, jamais négatif', () => {
  const d = { ...contrat(3), red: '5000', debut: '01/10/2026', debut_h: MATIN, fin: '02/10/2026', fin_h: APREM };
  assert.strictEqual(prixSelonDates(d).total, '0');
});
cas('contrat à distance (sans lignes) : jours × (prix/jour + forfait) − réduction', () => {
  const d = { pj: '80', forfait_extra: 25, red: '10', debut: '01/10/2026', debut_h: APREM, fin: '04/10/2026', fin_h: APREM };
  assert.deepStrictEqual(plain(prixSelonDates(d)), { duree: '3.5 j', stot: '367.5', total: '357.5' });
});
cas('contrat à distance, durée inchangée : montants de Romain conservés', () => {
  const d = { pj: '30.05', forfait_extra: 15, stot: '67.57', debut: '01/10/2026', debut_h: APREM, fin: '02/10/2026', fin_h: APREM };
  assert.strictEqual(prixSelonDates(d), null);
});
cas('données incomplètes : payload laissé tel quel', () => {
  assert.strictEqual(prixSelonDates({ pj: '', debut: '01/10/2026', fin: '02/10/2026' }), null);
  assert.strictEqual(prixSelonDates({ pj: '80,5', debut: '01/10/2026', fin: '02/10/2026' }), null);
  assert.strictEqual(prixSelonDates({ ...contrat(3), debut: '', fin: '02/10/2026' }), null);
  const deux = { pj: '100', lignes: [{ id: 'location', cents: 10000 }, { id: 'location', cents: 10000 }], debut: '01/10/2026', fin: '05/10/2026' };
  assert.strictEqual(prixSelonDates(deux), null);
});

cas('lignes fixes : même liste que le tarif et que la migration 013', () => {
  const fixesTarif = TARIF.options.filter((o) => o.fixe).map((o) => o.id);
  assert.deepStrictEqual(plain(PRIX_FIXES), ['service', 'assurance'].concat(fixesTarif));
  const m = /elsif l->>'id' in \(([^)]*)\) then/.exec(sql);
  assert(m, 'liste des lignes fixes introuvable dans 013');
  assert.deepStrictEqual(m[1].split(',').map((x) => x.trim().replace(/'/g, '')), plain(PRIX_FIXES));
});

cas('même jour, départ après-midi et retour matin : refusé (creneauxInverses)', () => {
  const src = /^function creneauxInverses\(.*$/m.exec(html);
  assert(src, 'creneauxInverses introuvable');
  const c = {};
  vm.createContext(c);
  vm.runInContext(src[0] + '\nthis.f=creneauxInverses;', c);
  assert.strictEqual(c.f('2026-10-01', APREM, '2026-10-01', MATIN), true);
  assert.strictEqual(c.f('01/10/2026', APREM, '01/10/2026', MATIN), true);
  assert.strictEqual(c.f('2026-10-01', MATIN, '2026-10-01', MATIN), false);
  assert.strictEqual(c.f('2026-10-01', APREM, '2026-10-01', APREM), false);
  assert.strictEqual(c.f('2026-10-01', APREM, '2026-10-02', MATIN), false);
  assert.strictEqual(c.f('', APREM, '', MATIN), false);
});

if (echecs) {
  console.log('\n' + echecs + ' échec(s).');
  process.exit(1);
}
console.log('\nTous les cas passent.');
