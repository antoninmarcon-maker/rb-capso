/*
 * Verification des helpers de date du calendrier de reservation (web/index.html).
 * Lancer:  node web/date-utils.test.js
 *
 * Zero dependance, comme le reste du projet.
 *
 * Les helpers vivent dans un <script> inline. On les extrait du fichier reel
 * et on les evalue: le test porte donc sur le code effectivement livre, pas
 * sur une copie qui pourrait diverger.
 *
 * Le bug corrige ici (conversion Date -> YYYY-MM-DD en passant par UTC) est
 * invisible dans la plupart des situations: il ne se declenche que dans
 * certains fuseaux, a certaines heures. Un test qui tourne dans un seul fuseau
 * ne l'aurait jamais vu. On relance donc ce fichier en sous-processus avec
 * plusieurs TZ, dont celui de la prod (Europe/Paris) et des fuseaux a decalage
 * negatif et a decalage non entier.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const FUSEAUX = [
  'Europe/Paris',      // la prod
  'UTC',               // le cas ou le bug ne se voit pas
  'America/New_York',  // decalage negatif: le bug bascule le soir, pas la nuit
  'Pacific/Auckland',  // decalage positif extreme (+12/+13)
  'Asia/Kolkata',      // decalage non entier (+5:30)
  'Pacific/Chatham'    // decalage non entier extreme (+12:45/+13:45)
];

// --- Extraction des helpers depuis le HTML livre --------------------------

function chargerHelpers() {
  const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
  const noms = ['toYMD', 'parseD', 'diffDays', 'fmtFR'];
  const sources = noms.map(nom => {
    // Les helpers sont des declarations sur une seule ligne.
    const re = new RegExp('^\\s*(function ' + nom + '\\s*\\(.*)$', 'm');
    const m = html.match(re);
    assert.ok(m, `helper ${nom}() introuvable dans web/index.html — le test doit etre mis a jour si le code a bouge`);
    return m[1].trim();
  });
  const fabrique = new Function(sources.join('\n') + '\nreturn {' + noms.join(',') + '};');
  return fabrique();
}

// --- Le contrat attendu ---------------------------------------------------

// Reference independante de l'implementation testee: le jour du calendrier
// local, celui que l'utilisateur lit sur sa montre.
function ymdAttendu(d) {
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function testsUnFuseau(tz) {
  const { toYMD, parseD, diffDays } = chargerHelpers();
  const cas = [];

  // 1. La fenetre minuit -> 02:00, celle qui casse la frontiere "jour passe".
  //    Un jour entier d'heures, pour ne dependre d'aucune hypothese sur
  //    l'amplitude du decalage du fuseau.
  for (let h = 0; h < 24; h++) {
    cas.push(new Date(2026, 7, 5, h, 30));
  }

  // 2. Changements d'heure (Europe/Paris 2026: 29/03 et 25/10) et leurs
  //    voisins immediats. On evite 02:00-03:00 le jour du passage a l'heure
  //    d'ete: cette heure locale n'existe pas.
  for (const [y, m, j] of [[2026, 2, 28], [2026, 2, 29], [2026, 2, 30],
                           [2026, 9, 24], [2026, 9, 25], [2026, 9, 26]]) {
    for (const h of [0, 1, 4, 12, 23]) cas.push(new Date(y, m, j, h, 30));
  }

  // 3. Frontieres de mois et d'annee, dans les deux sens.
  for (const [y, m, j] of [[2026, 0, 1], [2025, 11, 31], [2026, 1, 28],
                           [2026, 7, 1], [2026, 7, 31], [2026, 8, 1]]) {
    for (const h of [0, 0.5, 23].map(x => Math.floor(x))) cas.push(new Date(y, m, j, h, 30));
    cas.push(new Date(y, m, j, 23, 59));
  }

  for (const d of cas) {
    const attendu = ymdAttendu(d);
    assert.strictEqual(
      toYMD(d), attendu,
      `[${tz}] toYMD(${d.toString()}) doit rendre le jour LOCAL ${attendu}`
    );
  }

  // 4. Aller-retour: toYMD et parseD doivent etre reciproques. C'est
  //    l'invariant dont depend toute la comparaison de chaines du calendrier
  //    (isBooked, isPast, la boucle anti-conflit de pickDay).
  for (const s of ['2026-01-01', '2026-03-28', '2026-03-29', '2026-03-30',
                   '2026-08-05', '2026-10-24', '2026-10-25', '2026-10-26',
                   '2026-12-31']) {
    assert.strictEqual(
      toYMD(parseD(s)), s,
      `[${tz}] aller-retour parseD/toYMD casse sur ${s}`
    );
  }

  // 5. La boucle anti-conflit de pickDay: elle avance jour par jour avec
  //    setDate() et compare via toYMD(). On rejoue exactement cette
  //    progression et on verifie qu'elle enumere les jours strictement
  //    compris entre les deux bornes — sans en sauter ni en repeter un,
  //    y compris a travers un changement d'heure.
  const scanne = (debut, fin) => {
    const vus = [];
    const d = new Date(parseD(debut));
    d.setDate(d.getDate() + 1);
    let garde = 0;
    while (toYMD(d) < fin) {
      vus.push(toYMD(d));
      d.setDate(d.getDate() + 1);
      if (++garde > 400) throw new Error(`[${tz}] boucle pickDay non terminante ${debut} -> ${fin}`);
    }
    return vus;
  };

  assert.deepStrictEqual(scanne('2026-08-05', '2026-08-09'),
    ['2026-08-06', '2026-08-07', '2026-08-08'],
    `[${tz}] pickDay doit scanner les jours intermediaires`);

  assert.deepStrictEqual(scanne('2026-03-27', '2026-03-31'),
    ['2026-03-28', '2026-03-29', '2026-03-30'],
    `[${tz}] pickDay doit rester juste au passage a l'heure d'ete`);

  assert.deepStrictEqual(scanne('2026-10-23', '2026-10-27'),
    ['2026-10-24', '2026-10-25', '2026-10-26'],
    `[${tz}] pickDay doit rester juste au passage a l'heure d'hiver`);

  assert.deepStrictEqual(scanne('2026-08-05', '2026-08-06'), [],
    `[${tz}] deux jours consecutifs n'ont aucun jour intermediaire`);

  // 6. La frontiere "jour passe" de renderCal(). Le rendu fait, pour chaque
  //    case: today = toYMD(new Date()), isPast = ds < today. Un jour reservable
  //    ne doit jamais basculer en "passe" (case grisee, clic desactive) selon
  //    l'heure a laquelle le visiteur ouvre la page. On rejoue cette regle avec
  //    le vrai helper, heure par heure, sur les 24 heures d'une journee.
  const frontiere = (maintenant) => toYMD(maintenant);
  for (const [y, m, j] of [[2026, 7, 5], [2026, 2, 29], [2026, 9, 25], [2026, 0, 1]]) {
    const jourJ = ymdAttendu(new Date(y, m, j));
    const veille = ymdAttendu(new Date(y, m, j - 1));
    const lendemain = ymdAttendu(new Date(y, m, j + 1));
    for (let h = 0; h < 24; h++) {
      const today = frontiere(new Date(y, m, j, h, 30));
      assert.ok(!(jourJ < today),
        `[${tz}] a ${h}h30 le ${jourJ}, le jour courant est marque "passe" (today=${today})`);
      assert.ok(veille < today,
        `[${tz}] a ${h}h30 le ${jourJ}, la veille ${veille} n'est plus marquee "passe" (today=${today})`);
      assert.ok(!(lendemain < today),
        `[${tz}] a ${h}h30 le ${jourJ}, le lendemain ${lendemain} est marque "passe" (today=${today})`);
    }
  }

  // 7. diffDays, qui alimente le prix affiche: un changement d'heure ne doit
  //    pas faire apparaitre ou disparaitre une journee de location.
  assert.strictEqual(diffDays('2026-03-28', '2026-03-30'), 2,
    `[${tz}] diffDays fausse au passage a l'heure d'ete`);
  assert.strictEqual(diffDays('2026-10-24', '2026-10-26'), 2,
    `[${tz}] diffDays fausse au passage a l'heure d'hiver`);
  assert.strictEqual(diffDays('2026-08-05', '2026-08-05'), 0,
    `[${tz}] diffDays sur le meme jour`);
}

// --- Orchestration --------------------------------------------------------

if (process.env.RB_TEST_TZ) {
  testsUnFuseau(process.env.RB_TEST_TZ);
  console.log(`  ok  ${process.env.RB_TEST_TZ}`);
} else {
  console.log('Helpers de date du calendrier (web/index.html)');
  let echecs = 0;
  for (const tz of FUSEAUX) {
    try {
      const sortie = execFileSync(process.execPath, [__filename], {
        env: { ...process.env, TZ: tz, RB_TEST_TZ: tz },
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe']
      });
      process.stdout.write(sortie);
    } catch (e) {
      echecs++;
      console.log(`  ECHEC  ${tz}`);
      const detail = (e.stderr || '').split('\n').filter(l =>
        l.includes('AssertionError') || l.trim().startsWith('[') || l.includes('doit')
      ).slice(0, 4).join('\n');
      console.log(detail || (e.stderr || e.message).slice(0, 800));
    }
  }
  if (echecs) {
    console.log(`\n${echecs} fuseau(x) en echec.`);
    process.exit(1);
  }
  console.log(`\nTous les fuseaux passent (${FUSEAUX.length}).`);
}
