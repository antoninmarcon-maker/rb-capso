/*
 * Verification du tarif partage entre le site (web/index.html) et l'outil
 * interne (web/app/index.html).
 * Lancer:  node web/pricing.test.js
 *
 * Zero dependance, comme le reste du projet.
 *
 * Le projet n'a ni bundler ni modules : la formule de prix vit dans un
 * <script> inline, et elle doit exister dans les DEUX fichiers. Avant ce
 * test elle existait en trois copies qui divergeaient deja (la tente de toit
 * affichee « 40-60 EUR/j » sur le site pendant que le code calculait 50).
 *
 * Le bloc entre les marqueurs « TARIF PARTAGE (debut) » / « (fin) » est donc
 * extrait des deux fichiers reellement livres :
 *   1. il doit etre identique octet pour octet,
 *   2. il doit produire les montants attendus sur des cas fixes.
 * Toute modification du tarif se fait dans les deux fichiers, sinon la CI
 * echoue ici.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const lire = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');
// Les tableaux fabriques dans le contexte vm n'ont pas le meme prototype Array
// que ceux du test : deepStrictEqual les refuserait. On compare des valeurs.
const plain = (x) => JSON.parse(JSON.stringify(x));

const DEBUT = '// ═══ TARIF PARTAGÉ (début) ═══';
const FIN = '// ═══ TARIF PARTAGÉ (fin) ═══';

function extraireBloc(src, nom) {
  const a = src.indexOf(DEBUT);
  const b = src.indexOf(FIN);
  assert(a !== -1 && b !== -1 && b > a, 'bloc TARIF PARTAGÉ introuvable dans ' + nom);
  assert.strictEqual(src.indexOf(DEBUT, a + 1), -1, 'marqueur de début en double dans ' + nom);
  return src.slice(a, b + FIN.length);
}

let echecs = 0;
function cas(nom, fn) {
  try {
    fn();
    console.log('  ok     ' + nom);
  } catch (e) {
    echecs++;
    console.log('  ECHEC  ' + nom + '\n         ' + e.message);
  }
}

const blocSite = extraireBloc(lire('index.html'), 'web/index.html');
const blocApp = extraireBloc(lire('app/index.html'), 'web/app/index.html');

cas('le bloc tarif est identique dans le site et dans /app', () => {
  assert.strictEqual(blocApp, blocSite);
});

// On evalue le bloc du site (identique a celui de /app si le cas precedent passe).
const ctx = {};
vm.createContext(ctx);
vm.runInContext(
  blocSite + '\nthis.TARIF = TARIF; this.calculerEstimation = calculerEstimation; this.fmtEuros = fmtEuros;',
  ctx,
);
const { TARIF, calculerEstimation, fmtEuros } = ctx;

cas('constantes attendues : 3 forfaits, 4 options, 70 EUR de frais, 0,30 EUR/km', () => {
  assert.deepStrictEqual(plain(TARIF.forfaits.map((f) => [f.l, f.e])), [['100 km/jour', 0], ['200 km/jour', 15], ['Illimité', 25]]);
  assert.deepStrictEqual(plain(TARIF.options.map((o) => o.id)), ['surf', 'paddle', 'kayak', 'linge']);
  assert.strictEqual(TARIF.frais_service, 70);
  assert.strictEqual(TARIF.km_sup, 0.3);
});

cas('3 jours Pénélope, 200 km/j, surf + linge = 530 EUR', () => {
  const r = calculerEstimation({ jours: 3, prix_jour: 120, forfait: '200 km/jour', options: ['surf', 'linge'], sans_km: false });
  assert.deepStrictEqual(
    plain(r.lignes.map((l) => [l.id, l.cents])),
    [['location', 36000], ['forfait', 4500], ['surf', 3000], ['linge', 2500], ['service', 7000]],
  );
  assert.strictEqual(r.total_cents, 53000);
});

cas('forfait 100 km/j : inclus, aucune ligne de forfait', () => {
  const r = calculerEstimation({ jours: 2, prix_jour: 95, forfait: '100 km/jour', options: [], sans_km: false });
  assert.deepStrictEqual(plain(r.lignes.map((l) => l.id)), ['location', 'service']);
  assert.strictEqual(r.total_cents, 19000 + 7000);
});

cas('tente de toit : le forfait km est ignoré même si demandé', () => {
  const r = calculerEstimation({ jours: 2, prix_jour: 50, forfait: 'Illimité', options: [], sans_km: true });
  assert.deepStrictEqual(plain(r.lignes.map((l) => l.id)), ['location', 'service']);
  assert.strictEqual(r.total_cents, 17000);
});

cas('tente de toit : les options restent proposées', () => {
  const r = calculerEstimation({ jours: 2, prix_jour: 50, forfait: null, options: ['surf', 'paddle', 'kayak', 'linge'], sans_km: true });
  assert.strictEqual(r.total_cents, 10000 + 3 * 2000 + 2500 + 7000);
});

cas('demi-journée côté /app : arrondi au centime, matériel au prorata, linge fixe', () => {
  const r = calculerEstimation({ jours: 2.5, prix_jour: 95, forfait: null, options: ['paddle', 'linge'], sans_km: false });
  assert.strictEqual(r.total_cents, Math.round(2.5 * 95 * 100) + 2500 + 2500 + 7000);
});

cas('option inconnue ignorée, forfait inconnu ignoré', () => {
  const r = calculerEstimation({ jours: 1, prix_jour: 100, forfait: '500 km/jour', options: ['jetski'], sans_km: false });
  assert.strictEqual(r.total_cents, 17000);
});

cas('entrées absentes ou non numériques : 0 jour, frais seuls', () => {
  const r = calculerEstimation({});
  assert.strictEqual(r.total_cents, 7000);
  const r2 = calculerEstimation({ jours: 'abc', prix_jour: undefined, options: null });
  assert.strictEqual(r2.total_cents, 7000);
});

cas('libellé de la ligne location : singulier / pluriel', () => {
  assert.strictEqual(calculerEstimation({ jours: 1, prix_jour: 120 }).lignes[0].l, '1 jour × 120 €');
  assert.strictEqual(calculerEstimation({ jours: 3, prix_jour: 120 }).lignes[0].l, '3 jours × 120 €');
});

cas('fmtEuros : entiers sans décimales, centimes sur deux chiffres', () => {
  assert.strictEqual(fmtEuros(53000), '530 €');
  assert.strictEqual(fmtEuros(4750), '47,50 €');
  assert.strictEqual(fmtEuros(4705), '47,05 €');
  assert.strictEqual(fmtEuros(0), '0 €');
});

if (echecs) {
  console.log('\n' + echecs + ' échec(s).');
  process.exit(1);
}
console.log('\nTarif partagé : tout passe.');
