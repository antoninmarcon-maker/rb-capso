/*
 * Verification de l'adresse du locataire en trois champs (web/app/index.html).
 * Lancer:  node web/adresse-locataire.test.js
 *
 * Le contrat PDF imprime la cle l_adr telle quelle. Avec un seul champ
 * « Adresse complete », les locataires ne tapaient souvent que la rue : ni code
 * postal ni ville sur le contrat. On saisit donc rue / code postal / ville,
 * recomposes en « rue, CP Ville » dans l_adr (seule cle admise par la liste
 * blanche SQL), et redecoupes au pre-remplissage.
 *
 * Les fonctions vivent dans un <script> inline: on les extrait du fichier
 * reellement livre, pas d'une copie qui pourrait diverger.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');
const DEBUT = 'function adrComplete(';
const FIN = '\nfunction lcNextFromInfos(';
const a = src.indexOf(DEBUT);
const b = src.indexOf(FIN);
assert(a !== -1 && b !== -1 && b > a, 'adrComplete introuvable dans web/app/index.html');

// Faux DOM minimal : g(id) rend un champ, v(id) sa valeur nettoyee.
const champs = {};
const ctx = {
  g: (id) => (champs[id] ||= { value: '' }),
  v: (id) => String((champs[id] || { value: '' }).value).trim(),
};
vm.createContext(ctx);
vm.runInContext(src.slice(a, b) + '\nthis.adrComplete = adrComplete; this.adrRemplir = adrRemplir; this.locInfosOk = locInfosOk;', ctx);
const { adrComplete, adrRemplir, locInfosOk } = ctx;
const vider = () => { for (const k of Object.keys(champs)) delete champs[k]; };
const remplir = (o) => { vider(); for (const [k, val] of Object.entries(o)) ctx.g(k).value = val; };

// Recomposition
remplir({ x: '8 av. Victor Hugo', x_cp: '69001', x_ville: 'Lyon' });
assert.strictEqual(adrComplete('x'), '8 av. Victor Hugo, 69001 Lyon');
remplir({ x: '8 av. Victor Hugo' });
assert.strictEqual(adrComplete('x'), '8 av. Victor Hugo', 'sans CP ni ville : pas de virgule orpheline');
remplir({ x_cp: '40130', x_ville: 'Capbreton' });
assert.strictEqual(adrComplete('x'), '40130 Capbreton');
remplir({});
assert.strictEqual(adrComplete('x'), '');

// Redecoupage au pre-remplissage, puis aller-retour sans perte
const cas = [
  ['8 av. Victor Hugo, 69001 Lyon', '8 av. Victor Hugo', '69001', 'Lyon'],
  ['12 rue du Port 40130 Capbreton', '12 rue du Port', '40130', 'Capbreton'],
  ['Résidence 1234 Bât A, 40130 Capbreton', 'Résidence 1234 Bât A', '40130', 'Capbreton'],
  ['3 rue X, 1000 Bruxelles', '3 rue X', '1000', 'Bruxelles'],
  // le dernier code postal gagne, pas un numero de residence
  ['Résidence 1234 Bât A 40130 Capbreton', 'Résidence 1234 Bât A', '40130', 'Capbreton'],
  // pays francais en fin d'adresse : retire, sinon ville = « Lyon, France » en double
  ['8 rue X, 69001 Lyon, France', '8 rue X', '69001', 'Lyon'],
  ['8 rue X 69001 Lyon France', '8 rue X', '69001', 'Lyon'],
];
for (const [adr, rue, cp, ville] of cas) {
  vider();
  adrRemplir('x', adr);
  assert.deepStrictEqual([ctx.v('x'), ctx.v('x_cp'), ctx.v('x_ville')], [rue, cp, ville], adr);
}
remplir({});
adrRemplir('x', '8 av. Victor Hugo, 69001 Lyon');
assert.strictEqual(adrComplete('x'), '8 av. Victor Hugo, 69001 Lyon', 'aller-retour');

// Non reconnu : tout reste dans la rue, rien n'est perdu
for (const adr of ['8 av. Victor Hugo', '1250 route de Bayonne', '10 Downing St, London SW1A 2AA']) {
  vider();
  adrRemplir('x', adr);
  assert.strictEqual(ctx.v('x'), adr);
  assert.strictEqual(ctx.v('x_cp'), '');
}

// Validation locataire : CP et ville obligatoires
const ok = { loc_lnom: 'Martin', loc_lpre: 'Sophie', loc_lmail: 's@e.fr', loc_ladr: '8 av. Victor Hugo', loc_ladr_cp: '69001', loc_ladr_ville: 'Lyon' };
remplir(ok);
assert.strictEqual(locInfosOk(), true);
for (const k of ['loc_ladr', 'loc_ladr_cp', 'loc_ladr_ville']) {
  remplir({ ...ok, [k]: '  ' });
  assert.strictEqual(locInfosOk(), false, k + ' vide doit bloquer');
}

console.log('adresse-locataire: OK');
