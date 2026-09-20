/*
 * Verification du nettoyage du texte ecrit dans les PDF (web/app/index.html).
 * Lancer:  node web/pdf-text.test.js
 *
 * Zero dependance, comme le reste du projet.
 *
 * jsPDF ecrit avec l'Helvetica integree, encodee sur UN octet via la table
 * WinAnsi/CP1252. Tout caractere hors de cette table part en octets bruts:
 * « 🚐 VEHICULE » s'imprimait « Ø=Þ• VEHICULE » et « ❌ » s'imprimait « 'L »
 * sur tous les contrats sortis de l'app. On retire donc ces caracteres a
 * l'ecriture, ce qui couvre aussi ce que Romain ou le locataire saisissent.
 *
 * Deux risques opposes, d'ou ce test:
 *   1. laisser passer un caractere non encodable -> charabia dans le contrat,
 *   2. supprimer un caractere legitime -> contrat FAUX en silence, ce qui est
 *      pire (un nom ampute de ses accents sur un document signe).
 * La table des 27 caracteres de la zone 0x80-0x9F est donc verrouillee ici.
 *
 * La fonction vit dans un <script> inline: on l'extrait du fichier reellement
 * livre, pas d'une copie qui pourrait diverger.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const src = fs.readFileSync(path.join(__dirname, 'app/index.html'), 'utf8');

const DEBUT = 'const PDF_WINANSI_SUP=';
const FIN = '\nfunction pdfHeader(';
const a = src.indexOf(DEBUT);
const b = src.indexOf(FIN);
assert(a !== -1 && b !== -1 && b > a, 'pdfTxt introuvable dans web/app/index.html');
assert.strictEqual(src.indexOf(DEBUT, a + 1), -1, 'marqueur de debut en double');

const ctx = {};
vm.createContext(ctx);
vm.runInContext(src.slice(a, b) + '\nthis.pdfTxt = pdfTxt; this.SUP = PDF_WINANSI_SUP; this.pdfSafe = pdfSafe;', ctx);
const { pdfTxt, SUP, pdfSafe } = ctx;

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

// Table CP1252 0x80-0x9F. Les cinq trous (0x81 0x8D 0x8F 0x90 0x9D) ne sont pas definis.
const CP1252_SUP = '\u20AC\u201A\u0192\u201E\u2026\u2020\u2021\u02C6\u2030\u0160\u2039\u0152\u017D'
  + '\u2018\u2019\u201C\u201D\u2022\u2013\u2014\u02DC\u2122\u0161\u203A\u0153\u017E\u0178';

cas('la table supplementaire est exactement celle de CP1252 (27 caracteres)', () => {
  assert.strictEqual([...SUP].length, 27);
  assert.deepStrictEqual([...SUP].sort(), [...CP1252_SUP].sort());
});

cas('emoji retires : c\'est le bug d\'origine', () => {
  assert.strictEqual(pdfTxt('🚐 VÉHICULE'), 'VÉHICULE');
  assert.strictEqual(pdfTxt('👤 PROPRIÉTAIRE'), 'PROPRIÉTAIRE');
  assert.strictEqual(pdfTxt('✍️ SIGNATURES'), 'SIGNATURES');
  assert.strictEqual(pdfTxt("❌ CONDITIONS D'ANNULATION"), "CONDITIONS D'ANNULATION");
  assert.strictEqual(pdfTxt('Van rendu propre 🚐 ☕'), 'Van rendu propre');
});

cas('fleche et caracteres hors table retires', () => {
  assert.strictEqual(pdfTxt('01/07 → 03/07'), '01/07 03/07');
  assert.strictEqual(pdfTxt('a←b'), 'ab');
});

cas('caracteres WinAnsi preserves : accents, euro, tiret cadratin, point median', () => {
  assert.strictEqual(pdfTxt('110 €'), '110 €');
  assert.strictEqual(pdfTxt('RB · CAPSO'), 'RB · CAPSO');
  assert.strictEqual(pdfTxt('CONTRAT — SIGNÉ À DISTANCE'), 'CONTRAT — SIGNÉ À DISTANCE');
  assert.strictEqual(pdfTxt('N° permis, café, où, ça, être'), 'N° permis, café, où, ça, être');
  assert.strictEqual(pdfTxt('cœur Œuvre Ÿ š ž « » ’ “ … •'), 'cœur Œuvre Ÿ š ž « » ’ “ … •');
});

cas('les 27 caracteres de la zone supplementaire passent un par un', () => {
  for (const c of CP1252_SUP) {
    assert.strictEqual(pdfTxt('x' + c + 'y'), 'x' + c + 'y', 'U+' + c.codePointAt(0).toString(16));
  }
});

// Un nom colle depuis le Finder arrive en accents decomposes. Sans recomposition
// l'accent combinant serait retire et le contrat signe porterait un nom faux.
cas('accents decomposes recomposes, jamais amputes', () => {
  assert.strictEqual(pdfTxt('José'), 'José');
  assert.strictEqual(pdfTxt('Île de Ré'), 'Île de Ré');
  assert.strictEqual(pdfTxt('Zoé Lefèvre'), 'Zoé Lefèvre');
});

cas('espaces typographiques converties en espace, jamais supprimees', () => {
  assert.strictEqual(pdfTxt('a\tb'), 'a b');
  assert.strictEqual(pdfTxt('12 345 km'), '12 345 km');
  assert.strictEqual(pdfTxt('1 200'), '1 200');
  assert.strictEqual(pdfTxt('Pneu AV\tusé'), 'Pneu AV usé');
});

cas('espace insecable simple conservee telle quelle', () => {
  assert.strictEqual(pdfTxt('1 200 €'), '1 200 €');
});

cas('trait d\'union insecable et signe moins ramenes au tiret', () => {
  assert.strictEqual(pdfTxt('c‑a'), 'c-a');
  assert.strictEqual(pdfTxt('−30'), '-30');
});

cas('sauts de ligne conserves, espaces multiples reduites, bords coupes', () => {
  assert.strictEqual(pdfTxt('ligne1\nligne2'), 'ligne1\nligne2');
  assert.strictEqual(pdfTxt('a\n\nb'), 'a\n\nb');
  assert.strictEqual(pdfTxt('  trop   d\'espaces  '), 'trop d\'espaces');
});

cas('espace orpheline avant virgule ou point nettoyee, ; : ! ? intacts', () => {
  assert.strictEqual(pdfTxt('usé 🚐, caution'), 'usé, caution');
  assert.strictEqual(pdfTxt('fin ☕.'), 'fin.');
  assert.strictEqual(pdfTxt('Départ : 14h ; retour : 10h !'), 'Départ : 14h ; retour : 10h !');
});

cas('entrees absentes ou non textuelles', () => {
  assert.strictEqual(pdfTxt(null), '');
  assert.strictEqual(pdfTxt(undefined), '');
  assert.strictEqual(pdfTxt(''), '');
  assert.strictEqual(pdfTxt(0), '0');
  assert.strictEqual(pdfTxt(430), '430');
});

// Propriete generale : quoi qu'on lui donne, la sortie doit etre encodable sur
// un octet par jsPDF. C'est la garantie que plus aucun charabia ne peut sortir.
cas('tout ce qui sort est encodable en WinAnsi', () => {
  const entrees = [
    '🚐👤👥📅💳❌✍️🧰🔍📎📍🎥', 'Zoé  \t→←', 'ｆｕｌｌｗｉｄｔｈ', 'עברית', '中文', '🇫🇷',
    'Observations : rayure ⚠️ sur l\'aile → à voir ; caution 2 000 €',
  ];
  for (const e of entrees) {
    for (const c of pdfTxt(e)) {
      const n = c.codePointAt(0);
      const ok = n === 10 || n === 13 || (n >= 0x20 && n <= 0x7E) || (n >= 0xA0 && n <= 0xFF) || SUP.indexOf(c) >= 0;
      assert(ok, 'U+' + n.toString(16) + ' non encodable, issu de ' + JSON.stringify(e));
    }
  }
});

// Une ligature ou un exposant colles depuis un devis en PDF ne sont pas dans la
// table. Les supprimer emporterait AUSSI leurs lettres, en silence, sur un
// document signe : on retombe sur leur equivalent compatible.
cas('ligatures et exposants ramenes a leurs lettres, jamais amputes', () => {
  assert.strictEqual(pdfTxt('\uFB01nancement'), 'financement');
  assert.strictEqual(pdfTxt('ﬂeche'), 'fleche');
  assert.strictEqual(pdfTxt('2ᵉ conducteur'), '2e conducteur');
  assert.strictEqual(pdfTxt('N№ 4512'), 'NNo 4512');
  assert.strictEqual(pdfTxt('ｆｕｌｌ'), 'full');
});

// Le repli est tout ou rien. « \u2153 » se decompose en 1 + barre de fraction + 3 :
// garder ce qui passe imprimerait « 13 », un montant faux et credible. Absent se
// voit, faux ne se voit pas. Les fractions de WinAnsi, elles, passent normalement.
// Les 27 exceptions sont epinglees plus haut ; les deux plages qui portent TOUS
// les accents francais ne l'etaient pas. Ramener la borne a 0xFE supprimerait le
// « y » trema des contrats sans qu'aucun test ne bronche : un locataire de
// L'Hay-les-Roses verrait son adresse amputee sur un document signe.
cas('les 320 points des deux plages WinAnsi passent un par un', () => {
  for (let n = 0x20; n <= 0x7E; n++) {
    const c = String.fromCharCode(n);
    assert.strictEqual(pdfTxt('x' + c + 'y'), 'x' + c + 'y', 'U+' + n.toString(16));
  }
  for (let n = 0xA0; n <= 0xFF; n++) {
    const c = String.fromCharCode(n);
    assert.strictEqual(pdfTxt('x' + c + 'y'), 'x' + c + 'y', 'U+' + n.toString(16));
  }
  assert.strictEqual(pdfTxt("L'Haÿ-les-Roses"), "L'Haÿ-les-Roses");
});

cas('les bornes par l\'exterieur restent retirees', () => {
  for (const c of ['\u007F', '\u0080', '\u008D', '\u009F']) {
    assert.strictEqual(pdfTxt('x' + c + 'y'), 'xy', 'U+' + c.codePointAt(0).toString(16));
  }
});

// Un locataire roumain, tcheque, turc, letton ou polonais n'a rien d'exotique
// pour une location de van. Ces lettres ne sont pas dans la table : sans ce
// dernier repli, l'accent emporterait la lettre de base et « Stefan » serait
// imprime « tefan ». Les lettres atomiques (l barre, i sans point) restent
// perdues, seule une police Unicode embarquee les sauverait.
cas('lettres europeennes hors Latin-1 : l\'accent tombe, la lettre reste', () => {
  assert.strictEqual(pdfTxt('Ștefan Popescu'), 'Stefan Popescu');
  assert.strictEqual(pdfTxt('Václav Řeháček'), 'Václav Rehácek');
  assert.strictEqual(pdfTxt('Jānis Ozoliņš'), 'Janis Ozolinš');
  assert.strictEqual(pdfTxt('Başak'), 'Basak');
  assert.strictEqual(pdfTxt('Jānis'), 'Janis');
  assert.strictEqual(pdfTxt('Michał Kowalczyk'), 'Micha Kowalczyk');
});

cas('fractions : jamais recollees en un nombre faux', () => {
  assert.strictEqual(pdfTxt('\u2153'), '');
  assert.strictEqual(pdfTxt('\u215B'), '');
  assert.strictEqual(pdfTxt('\u2153 de la caution'), 'de la caution');
  assert.strictEqual(pdfTxt('\u00BD'), '\u00BD');
  assert.strictEqual(pdfTxt('\u00BC et \u00BE'), '\u00BC et \u00BE');
});

cas('decomposition partielle refusee : pas d\'espace parasite non plus', () => {
  assert.strictEqual(pdfTxt('\u02D8'), '');
  assert.strictEqual(pdfTxt('a\u02DDb'), 'ab');
});

cas('le repli ne mange pas les insecables ni ne ressuscite les emoji', () => {
  assert.strictEqual(pdfTxt('2 000 €'), '2 000 €');
  assert.strictEqual(pdfTxt('a🚐b'), 'ab');
  assert.strictEqual(pdfTxt('עברית'), '');
});

cas('marque d\'ordre des octets retiree, pas transformee en espace', () => {
  assert.strictEqual(pdfTxt('abc﻿def'), 'abcdef');
  assert.strictEqual(pdfTxt('abc​def'), 'abcdef');
});

// splitTextToSize nettoie, puis doc.text renettoie les memes lignes : le nombre
// de lignes qui sert a avancer le curseur vertical doit rester exact.
cas('idempotence : nettoyer deux fois donne le meme resultat', () => {
  const entrees = ['a\tb  c', 'Zoé  →', 'xﬁy, z', '  ﻿ ', 'ligne1\nligne2', '2 000 €'];
  for (const e of entrees) assert.strictEqual(pdfTxt(pdfTxt(e)), pdfTxt(e), JSON.stringify(e));
});

// --- pdfSafe : l'enveloppe posee sur le document jsPDF ---------------------
// Sa casse serait totale et muette (titres decentres, lignes perdues), d'ou un
// faux document qui enregistre ce que recoit le vrai `text`.
function fauxDoc() {
  const recu = [];
  return {
    recu,
    text(...a) { recu.push(['text', ...a]); return this; },
    splitTextToSize(...a) { recu.push(['split', ...a]); return String(a[0]).split('\n'); },
  };
}

cas('pdfSafe nettoie le texte sans toucher aux autres arguments', () => {
  const d = pdfSafe(fauxDoc());
  d.text('🚐 VÉHICULE', 15, 42);
  assert.deepStrictEqual(d.recu[0], ['text', 'VÉHICULE', 15, 42]);
});

cas('pdfSafe preserve le 4e argument : sans lui les titres centres partent a gauche', () => {
  const d = pdfSafe(fauxDoc());
  d.text('RB · CAPSO', 105, 15, { align: 'center' });
  assert.deepStrictEqual(d.recu[0], ['text', 'RB · CAPSO', 105, 15, { align: 'center' }]);
});

cas('pdfSafe gere un tableau de lignes et les valeurs non textuelles', () => {
  const d = pdfSafe(fauxDoc());
  d.text(['ligne 🚐 une', 'ligne deux'], 60, 10);
  assert.deepStrictEqual(d.recu[0], ['text', ['ligne une', 'ligne deux'], 60, 10]);
  d.text(430, 58, 20);
  assert.deepStrictEqual(d.recu[1], ['text', '430', 58, 20]);
});

cas('pdfSafe nettoie aussi splitTextToSize, et la largeur suit', () => {
  const d = pdfSafe(fauxDoc());
  d.splitTextToSize('texte 🚐 coupe', 178);
  assert.deepStrictEqual(d.recu[0], ['split', 'texte coupe', 178]);
});

cas('pdfSafe rend le document et preserve this', () => {
  const brut = fauxDoc();
  const d = pdfSafe(brut);
  assert.strictEqual(d, brut);
  assert.strictEqual(d.text('a', 1, 2), d);
});

// Le texte contractuel reellement livre doit traverser sans la moindre retouche.
cas('le texte des conditions d\'annulation ressort octet pour octet', () => {
  const m = src.match(/const ANNULATION_BASE="([^"]+)"/);
  assert(m, 'ANNULATION_BASE introuvable dans web/app/index.html');
  assert.strictEqual(pdfTxt(m[1]), m[1]);
});

console.log(echecs ? '\nTexte PDF : ' + echecs + ' echec(s).' : '\nTexte PDF : tout passe.');
process.exit(echecs ? 1 : 0);
