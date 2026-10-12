/*
 * Estimation de la demande de réservation (web/app/index.html, bloc
 * « ESTIMATION DEMANDE ») : le prix doit s'ajuster aux créneaux matin / après-midi
 * exactement comme sur le contrat (calcDu) et dans la base (migration 013).
 * Lancer :  node web/demande-creneaux.test.js
 *
 * Zéro dépendance, comme le reste du projet.
 *
 * Demande de Romain du 12/10/2026 : « donner la proposition d'arrivée et de départ
 * matin ou après-midi avec le prix qui s'ajuste comme sur le contrat ». Avant, le
 * formulaire comptait des jours calendaires pleins quel que soit le créneau.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, 'app', 'index.html'), 'utf8');
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
  extraire('// ═══ PRIX LOCATAIRE (début) ═══', '// ═══ PRIX LOCATAIRE (fin) ═══') + '\n' +
  extraire('// ═══ ESTIMATION DEMANDE (début) ═══', '// ═══ ESTIMATION DEMANDE (fin) ═══') +
  '\nthis.dureeDemande=dureeDemande;this.estimationDemande=estimationDemande;this.joursLocation=joursLocation;this.calculerEstimation=calculerEstimation;this.locationParSaison=locationParSaison;this.TARIF=TARIF;',
  ctx
);
const { dureeDemande, estimationDemande, joursLocation, calculerEstimation, locationParSaison, TARIF } = ctx;

let echecs = 0;
function cas(nom, fn) {
  try { fn(); console.log('ok   ' + nom); }
  catch (e) { echecs++; console.log('FAIL ' + nom + '\n     ' + e.message); }
}

// Libellés exacts posés par setSlot() dans les champs cachés dem_h1 / dem_h2.
const MATIN = 'Matin (avant 14h)', APREM = 'Après-midi (après 14h)';

// ── Durée ──────────────────────────────────────────────────────────────────────

cas('durée : sans créneau = jours calendaires (comportement d\'avant)', () => {
  assert.strictEqual(dureeDemande('2026-10-01', '', '2026-10-03', ''), 3);
});
cas('durée : départ matin, retour après-midi = jours calendaires', () => {
  assert.strictEqual(dureeDemande('2026-10-01', MATIN, '2026-10-03', APREM), 3);
});
cas('durée : départ après-midi retire une demi-journée', () => {
  assert.strictEqual(dureeDemande('2026-10-01', APREM, '2026-10-03', APREM), 2.5);
});
cas('durée : retour matin retire une demi-journée', () => {
  assert.strictEqual(dureeDemande('2026-10-01', MATIN, '2026-10-03', MATIN), 2.5);
});
cas('durée : départ après-midi et retour matin retirent une journée', () => {
  assert.strictEqual(dureeDemande('2026-10-01', APREM, '2026-10-03', MATIN), 2);
  // deux jours calendaires, départ l'après-midi et retour le lendemain matin = 1 jour
  assert.strictEqual(dureeDemande('2026-10-01', APREM, '2026-10-02', MATIN), 1);
});
cas('durée : dates absentes, inversées ou identiques = 0 (le formulaire refuse le jour même)', () => {
  assert.strictEqual(dureeDemande('', MATIN, '2026-10-03', APREM), 0);
  assert.strictEqual(dureeDemande('2026-10-01', MATIN, '', APREM), 0);
  assert.strictEqual(dureeDemande('2026-10-05', MATIN, '2026-10-03', APREM), 0);
  assert.strictEqual(dureeDemande('2026-10-03', APREM, '2026-10-03', MATIN), 0);
  assert.strictEqual(dureeDemande('n/a', MATIN, '2026-10-03', APREM), 0);
});
cas('durée : passage à l\'heure d\'hiver sans effet', () => {
  assert.strictEqual(dureeDemande('2026-10-24', MATIN, '2026-10-26', APREM), 3);
  assert.strictEqual(dureeDemande('2026-10-24', APREM, '2026-10-26', MATIN), 2);
});
cas('durée : même règle que le lien locataire (joursLocation) sur un an de combinaisons', () => {
  const fr = (iso) => iso.slice(8, 10) + '/' + iso.slice(5, 7) + '/' + iso.slice(0, 4);
  const iso = (d) => d.toISOString().slice(0, 10);
  const base = Date.UTC(2026, 0, 1);
  for (let i = 0; i < 365; i += 7) {
    for (const len of [1, 2, 5, 14]) {
      const d1 = iso(new Date(base + i * 86400000)), d2 = iso(new Date(base + (i + len) * 86400000));
      for (const h1 of [MATIN, APREM]) for (const h2 of [MATIN, APREM]) {
        assert.strictEqual(dureeDemande(d1, h1, d2, h2), joursLocation(fr(d1), h1, fr(d2), h2), d1 + ' ' + h1 + ' → ' + d2 + ' ' + h2);
      }
    }
  }
});

// ── Estimation ─────────────────────────────────────────────────────────────────

// Peggy en hiver : 70 €/jour. Forfait 200 km (+15 €/j), paddle (10 €/j), linge (25 € fixe).
const PEGGY = { vehicule: 'peggy', debut: '2026-10-01', fin: '2026-10-03', forfait: '200 km/jour', options: ['paddle', 'linge'], sans_km: false };

cas('estimation : sans demi-journée, identique au calcul de saison jour par jour', () => {
  const avant = calculerEstimation({ vehicule: 'peggy', debut: '2026-10-01', fin: '2026-10-03', forfait: '200 km/jour', options: ['paddle', 'linge'], sans_frais: true });
  for (const [h1, h2] of [['', ''], [MATIN, APREM], [MATIN, ''], ['', APREM]]) {
    const e = estimationDemande({ ...PEGGY, debut_h: h1, fin_h: h2 });
    assert.deepStrictEqual(plain(e.lignes), plain(avant.lignes));
    assert.strictEqual(e.total_cents, avant.total_cents);
    assert.strictEqual(e.jours, 3);
    assert.strictEqual(e.saison, '');
  }
  // 3 × 70 + 3 × 15 + 3 × 10 + 25 = 310 €, sans frais de service
  assert.strictEqual(avant.total_cents, 31000);
});
cas('estimation : départ après-midi = 2,5 jours au prix de saison, forfait et options au prorata', () => {
  const e = estimationDemande({ ...PEGGY, debut_h: APREM, fin_h: APREM });
  assert.strictEqual(e.jours, 2.5);
  // 2,5 × 70 + 2,5 × 15 + 2,5 × 10 + 25 = 262,50 €
  assert.strictEqual(e.total_cents, 26250);
  assert.strictEqual(e.lignes.find((l) => l.id === 'location').cents, 17500);
  assert.strictEqual(e.lignes.find((l) => l.id === 'forfait').cents, 3750);
  assert.strictEqual(e.lignes.find((l) => l.id === 'paddle').cents, 2500);
  assert.strictEqual(e.lignes.find((l) => l.id === 'linge').cents, 2500);
  assert.strictEqual(e.lignes.find((l) => l.id === 'location').l, '2,5 jours × 70 €');
  assert.strictEqual(e.saison, ''); // une seule saison : pas de détail, la ligne suffit
});
cas('estimation : retour matin = 2,5 jours, départ après-midi + retour matin = 2 jours', () => {
  assert.strictEqual(estimationDemande({ ...PEGGY, debut_h: MATIN, fin_h: MATIN }).total_cents, 26250);
  // 2 × 70 + 2 × 15 + 2 × 10 + 25 = 215 €
  assert.strictEqual(estimationDemande({ ...PEGGY, debut_h: APREM, fin_h: MATIN }).total_cents, 21500);
});
cas('estimation : le prix baisse bien quand le client passe du matin à l\'après-midi au départ', () => {
  const plein = estimationDemande({ ...PEGGY, debut_h: MATIN, fin_h: APREM }).total_cents;
  const demi = estimationDemande({ ...PEGGY, debut_h: APREM, fin_h: APREM }).total_cents;
  assert.ok(demi < plein, demi + ' < ' + plein);
});
cas('estimation : avec demi-journée, même total que le contrat (durée × prix moyen de saison)', () => {
  // Le contrat (calcDu + estimationContrat) : durée avec demi-journées × prix moyen de
  // saison arrondi au centime ; mêmes forfait et options ; frais de service en plus.
  // Sans demi-journée, la demande garde le calcul exact jour par jour du site (le
  // contrat, lui, peut perdre quelques centimes d'arrondi à cheval sur deux saisons).
  let compares = 0;
  for (const [d1, d2] of [['2026-10-01', '2026-10-03'], ['2026-04-28', '2026-05-04'], ['2026-07-10', '2026-07-24']]) {
    for (const veh of ['penelop', 'peggy', 'pamela']) {
      for (const h1 of [MATIN, APREM]) for (const h2 of [MATIN, APREM]) {
        const j = dureeDemande(d1, h1, d2, h2);
        const s = locationParSaison(veh, d1, d2);
        const demande = estimationDemande({ vehicule: veh, debut: d1, debut_h: h1, fin: d2, fin_h: h2, forfait: 'Illimité', options: ['surf', 'linge'], sans_km: false });
        const site = calculerEstimation({ vehicule: veh, debut: d1, fin: d2, forfait: 'Illimité', options: ['surf', 'linge'], sans_frais: true });
        const ctx = veh + ' ' + d1 + ' ' + h1 + ' → ' + d2 + ' ' + h2;
        if (j === s.jours) { assert.strictEqual(demande.total_cents, site.total_cents, ctx); continue; }
        const pj = Math.round(s.cents / s.jours) / 100;
        const contrat = calculerEstimation({ jours: j, prix_jour: pj, forfait: 'Illimité', options: ['surf', 'linge'], frais_service: 70 });
        assert.strictEqual(demande.total_cents, contrat.total_cents - 7000, ctx);
        compares++;
      }
    }
  }
  assert.strictEqual(compares, 27);
});
cas('estimation : à cheval sur deux saisons, prix moyen arrondi au centime et détail de saison', () => {
  // Pénélope du 29/04 au 03/05 : 2 jours mi-saison (100) + 3 jours été (130) = 590 € / 5 j = 118 €/j
  const e = estimationDemande({ vehicule: 'penelop', debut: '2026-04-29', debut_h: APREM, fin: '2026-05-03', fin_h: APREM, forfait: null, options: [], sans_km: false });
  assert.strictEqual(e.jours, 4.5);
  assert.strictEqual(e.total_cents, Math.round(4.5 * 118 * 100));
  assert.ok(e.saison.includes('2 jours × 100 € (mi-saison)') && e.saison.includes('3 jours × 130 € (été)'), e.saison);
  assert.ok(e.saison.includes('118 €/jour en moyenne'), e.saison);
  assert.strictEqual(e.lignes.find((l) => l.id === 'location').l, '4,5 jours × 118 €');
  // Peggy du 30/04 au 02/05 : 80 + 110 + 110 = 300 € / 3 j = 100 €/j ; prix moyen non entier possible
  const e3 = estimationDemande({ vehicule: 'peggy', debut: '2026-04-29', debut_h: APREM, fin: '2026-05-02', fin_h: APREM, forfait: null, options: [], sans_km: false });
  // 2 × 80 + 2 × 110 = 380 € / 4 j = 95 €/j → 3,5 × 95 = 332,50 €
  assert.strictEqual(e3.total_cents, 33250);
  assert.ok(e3.saison.includes('95 €/jour en moyenne'), e3.saison);
  // Pénélope du 30/04 au 02/05 : 100 + 130 + 130 = 360 € / 3 j = 120 €/j, retour matin = 2,5 j
  const e2 = estimationDemande({ vehicule: 'penelop', debut: '2026-04-30', debut_h: MATIN, fin: '2026-05-02', fin_h: MATIN, forfait: null, options: [], sans_km: false });
  assert.strictEqual(e2.total_cents, 30000);
});
cas('estimation : tente de toit sans forfait kilométrique, matériel au prorata', () => {
  const e = estimationDemande({ vehicule: 'tente', debut: '2026-08-01', debut_h: APREM, fin: '2026-08-03', fin_h: MATIN, forfait: null, options: ['materiel'], sans_km: true });
  assert.strictEqual(e.jours, 2);
  assert.strictEqual(e.lignes.some((l) => l.id === 'forfait'), false);
  // 2 × 50 + 2 × 15 = 130 €
  assert.strictEqual(e.total_cents, 13000);
});
cas('estimation : jamais de frais de service sur la demande, même avec demi-journée', () => {
  for (const h1 of ['', MATIN, APREM]) {
    const e = estimationDemande({ ...PEGGY, debut_h: h1, fin_h: MATIN });
    assert.strictEqual(e.lignes.some((l) => l.id === 'service' || l.id === 'assurance'), false);
  }
});
cas('estimation : retour le jour même = 0 jour, rien de facturé à la journée', () => {
  const e = estimationDemande({ ...PEGGY, fin: '2026-10-01', debut_h: APREM, fin_h: MATIN });
  assert.strictEqual(e.jours, 0);
  assert.strictEqual(e.lignes.filter((l) => l.id === 'location').reduce((a, l) => a + l.cents, 0), 0);
  assert.strictEqual(e.total_cents, 2500); // seul le kit linge, prix fixe (le formulaire masque de toute façon l'estimation)
});

// ── Câblage du formulaire ──────────────────────────────────────────────────────

cas('formulaire : les quatre boutons de créneau relancent l\'estimation', () => {
  for (const f of ['dem_h1', 'dem_h2']) for (const s of ['am', 'pm']) {
    const n = html.split("onclick=\"setSlot('" + f + "','" + s + "',renderDemEstimate)\"").length - 1;
    assert.strictEqual(n, 1, f + ' ' + s);
  }
});
cas('formulaire : demJours et demEstimation lisent les créneaux saisis', () => {
  assert.ok(html.includes("function demJours(){return dureeDemande(v('dem_d1'),v('dem_h1'),v('dem_d2'),v('dem_h2'));}"));
  assert.ok(/debut_h:v\('dem_h1'\),fin:v\('dem_d2'\),fin_h:v\('dem_h2'\)/.test(html));
});

console.log(echecs ? '\n' + echecs + ' échec(s)' : '\nTous les cas passent.');
process.exit(echecs ? 1 : 0);
