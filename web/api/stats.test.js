/*
 * Verification de web/api/stats.js sans reseau ni compte Google.
 * Lancer:  node web/api/stats.test.js
 *
 * Zero dependance, comme la fonction testee. On genere une vraie paire de
 * cles RSA a la volee pour que la signature du JWT s'execute pour de bon,
 * et on remplace fetch pour simuler Google.
 */

const crypto = require('node:crypto');
const assert = require('node:assert');

const { privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
});

process.env.STATS_PASSWORD = 'motdepasse-de-test';
process.env.GA_PROPERTY_ID = '000000000';
process.env.GA_SA_EMAIL = 'test@exemple.iam.gserviceaccount.com';
// La vraie variable Vercel contient des \n litteraux: on reproduit ce cas,
// c'est exactement la que ce genre de code casse en production.
process.env.GA_SA_KEY = privateKey.replace(/\n/g, '\\n');
process.env.STATS_BUDGET_ADS = '34,10';

const REPONSE_GA4 = {
  reports: [
    { rows: [{ metricValues: [{ value: '1247' }, { value: '1502' }] }] },
    { rows: [
      { dimensionValues: [{ value: 'Organic Search' }], metricValues: [{ value: '612' }] },
      { dimensionValues: [{ value: 'Direct' }], metricValues: [{ value: '324' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'clic_telephone' }], metricValues: [{ value: '47' }] },
      { dimensionValues: [{ value: 'clic_whatsapp' }], metricValues: [{ value: '89' }] },
      { dimensionValues: [{ value: 'demande_reservation' }], metricValues: [{ value: '12' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'penelop' }], metricValues: [{ value: '44' }] },
      { dimensionValues: [{ value: 'vans' }], metricValues: [{ value: '96' }] },
      { dimensionValues: [{ value: '(not set)' }], metricValues: [{ value: '3' }] }
    ] }
  ]
};

let appelsGA4 = [];
global.fetch = async function (url, options) {
  if (String(url).indexOf('oauth2.googleapis.com') > -1) {
    return { ok: true, status: 200, json: async () => ({ access_token: 'jeton-factice' }) };
  }
  appelsGA4.push(JSON.parse(options.body));
  return { ok: true, status: 200, json: async () => REPONSE_GA4 };
};

const handler = require('./stats.js');

function fausseReponse() {
  const r = { code: 0, corps: null, entetes: {} };
  r.setHeader = (k, v) => { r.entetes[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (d) => { r.corps = d; return r; };
  return r;
}

const appel = async (body, method) => {
  const r = fausseReponse();
  await handler({ method: method || 'POST', body }, r);
  return r;
};

(async function () {
  let ok = 0;
  const test = (nom, fn) => {
    try { fn(); console.log('  ok   ' + nom); ok++; }
    catch (e) { console.log('  ECHEC ' + nom + ' -> ' + e.message); process.exitCode = 1; }
  };

  console.log('Refus des acces invalides');
  const sansMdp = await appel({});
  test('mot de passe absent renvoie 401', () => assert.strictEqual(sansMdp.code, 401));

  const mauvais = await appel({ motDePasse: 'pas-le-bon' });
  test('mot de passe faux renvoie 401', () => assert.strictEqual(mauvais.code, 401));

  const court = await appel({ motDePasse: 'x' });
  test('mot de passe de longueur differente renvoie 401 sans planter',
    () => assert.strictEqual(court.code, 401));

  const enGet = await appel({ motDePasse: 'motdepasse-de-test' }, 'GET');
  test('GET est refuse', () => assert.strictEqual(enGet.code, 405));

  test('aucune requete GA4 sur acces refuse', () => assert.strictEqual(appelsGA4.length, 0));

  console.log('\nAcces valide');
  const r = await appel({ motDePasse: 'motdepasse-de-test' });
  test('renvoie 200', () => assert.strictEqual(r.code, 200));
  test('visiteurs remontes', () => assert.strictEqual(r.corps.visiteurs, 1247));
  test('sessions remontees', () => assert.strictEqual(r.corps.sessions, 1502));
  test('demandes isolees des clics', () => assert.strictEqual(r.corps.demandes, 12));
  test('clic telephone', () => assert.strictEqual(r.corps.clics.telephone, 47));
  test('clic whatsapp', () => assert.strictEqual(r.corps.clics.whatsapp, 89));
  test('clic absent vaut 0, pas undefined', () => assert.strictEqual(r.corps.clics.email, 0));
  test('sources ordonnees', () => assert.strictEqual(r.corps.sources[0].nom, 'Organic Search'));
  test('budget saisi a la main remonte', () => assert.strictEqual(r.corps.budgetAds, '34,10'));

  console.log('\nSeparation vans / sections');
  test('slug de van traduit en nom lisible',
    () => assert.strictEqual(r.corps.vans[0].nom, 'Pénélope'));
  test('une section de page ne finit pas dans les vans',
    () => assert.ok(!r.corps.vans.some(v => v.nom === 'vans')));
  test('la section vans est classee a part',
    () => assert.ok(r.corps.sections.some(s => s.nom === 'vans')));
  test('(not set) est ecarte',
    () => assert.ok(!r.corps.vans.some(v => v.nom === '(not set)')));

  console.log('\nPeriode');
  const sur7 = await appel({ motDePasse: 'motdepasse-de-test', jours: 7 });
  test('periode 7 jours acceptee', () => assert.strictEqual(sur7.corps.jours, 7));
  test('la requete GA4 utilise bien 7 jours',
    () => assert.strictEqual(appelsGA4[appelsGA4.length - 1].requests[0].dateRanges[0].startDate, '7daysAgo'));

  const absurde = await appel({ motDePasse: 'motdepasse-de-test', jours: 9999 });
  test('periode fantaisiste retombe sur 30 jours',
    () => assert.strictEqual(absurde.corps.jours, 30));

  console.log('\nPanne cote Google');
  global.fetch = async () => ({ ok: false, status: 500, text: async () => 'BOOM secret interne' });
  const panne = await appel({ motDePasse: 'motdepasse-de-test' });
  test('renvoie 502', () => assert.strictEqual(panne.code, 502));
  test('ne fuite pas le detail de l\'erreur',
    () => assert.ok(JSON.stringify(panne.corps).indexOf('secret') === -1));

  console.log('\nCampagnes : validation des saisies');
  process.env.SUPABASE_URL = 'https://exemple.supabase.co';
  process.env.SUPABASE_SERVICE_KEY = 'cle-de-test';

  let inserts = [];
  let suppressions = [];
  const CAMPAGNES = [
    { id: '11111111-1111-1111-1111-111111111111', nom: 'Insta août', canal: 'instagram',
      date_debut: '2026-08-01', date_fin: '2026-08-15', budget_cents: 12000,
      utm_campaign: 'insta_aout' },
    { id: '22222222-2222-2222-2222-222222222222', nom: 'Flyers camping', canal: 'flyers',
      date_debut: '2026-08-05', date_fin: '2026-08-20', budget_cents: 5000,
      utm_campaign: null }
  ];

  global.fetch = async function (url, options) {
    const u = String(url);
    if (u.indexOf('oauth2.googleapis.com') > -1) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'jeton-factice' }) };
    }
    if (u.indexOf('supabase.co') > -1) {
      if (options && options.method === 'POST') {
        inserts.push(JSON.parse(options.body));
        return { ok: true, status: 201, json: async () => ([{}]) };
      }
      if (options && options.method === 'DELETE') {
        suppressions.push(u);
        return { ok: true, status: 204, json: async () => ([]) };
      }
      return { ok: true, status: 200, json: async () => CAMPAGNES };
    }
    // GA4 par campagne: 1247 visiteurs sur le site, 137 attribues.
    const envoye = JSON.parse(options.body);
    const rapports = [
      { rows: [{ metricValues: [{ value: '412' }] }] },
      { rows: [{ dimensionValues: [{ value: 'demande_reservation' }], metricValues: [{ value: '9' }] }] }
    ];
    if (envoye.requests.length === 4) {
      rapports.push({ rows: [{ metricValues: [{ value: '137' }] }] });
      rapports.push({ rows: [{ dimensionValues: [{ value: 'demande_reservation' }], metricValues: [{ value: '4' }] }] });
    }
    return { ok: true, status: 200, json: async () => ({ reports: rapports }) };
  };

  const MDP = 'motdepasse-de-test';
  const ajouter = (campagne) => appel({ motDePasse: MDP, action: 'ajouter_campagne', campagne });

  const sansNom = await ajouter({ nom: '   ', debut: '2026-08-01', fin: '2026-08-15' });
  test('nom vide refuse', () => assert.strictEqual(sansNom.code, 400));

  const dateKo = await ajouter({ nom: 'X', debut: '01/08/2026', fin: '2026-08-15' });
  test('date mal formee refusee', () => assert.strictEqual(dateKo.code, 400));

  const inverse = await ajouter({ nom: 'X', debut: '2026-08-20', fin: '2026-08-01' });
  test('fin avant debut refusee', () => assert.strictEqual(inverse.code, 400));

  const budgetKo = await ajouter({ nom: 'X', debut: '2026-08-01', fin: '2026-08-15', budget: 'douze' });
  test('budget non numerique refuse', () => assert.strictEqual(budgetKo.code, 400));

  test('aucune insertion sur saisie invalide', () => assert.strictEqual(inserts.length, 0));

  const bon = await ajouter({ nom: '  Insta août  ', debut: '2026-08-01', fin: '2026-08-15', budget: '120,50' });
  test('campagne valide acceptee', () => assert.strictEqual(bon.code, 200));
  test('nom nettoye des espaces', () => assert.strictEqual(inserts[0].nom, 'Insta août'));
  test('budget euros converti en centimes entiers',
    () => assert.strictEqual(inserts[0].budget_cents, 12050));
  await ajouter({ nom: 'Y', debut: '2026-08-01', fin: '2026-08-02', budget: '' });
  test('budget vide stocke null',
    () => assert.strictEqual(inserts[1].budget_cents, null));

  const idKo = await appel({ motDePasse: MDP, action: 'supprimer_campagne', id: 'pas-un-uuid' });
  test('suppression avec identifiant invalide refusee', () => assert.strictEqual(idKo.code, 400));
  test('aucune suppression declenchee', () => assert.strictEqual(suppressions.length, 0));

  console.log('\nCampagnes : attribution honnete');
  const liste = await appel({ motDePasse: MDP, action: 'campagnes' });
  test('renvoie 200', () => assert.strictEqual(liste.code, 200));
  test('deux campagnes remontees', () => assert.strictEqual(liste.corps.campagnes.length, 2));

  const tracee = liste.corps.campagnes[0];
  const horsLigne = liste.corps.campagnes[1];

  test('campagne tracee: activite du site renseignee',
    () => assert.strictEqual(tracee.site.visiteurs, 412));
  test('campagne tracee: attribution distincte du total site',
    () => assert.strictEqual(tracee.attribue.visiteurs, 137));
  test('campagne hors ligne: attribue vaut null, pas zero',
    () => assert.strictEqual(horsLigne.attribue, null));
  test('campagne hors ligne signalee comme non tracee',
    () => assert.strictEqual(horsLigne.tracee, false));
  test('budget reconverti en euros',
    () => assert.strictEqual(tracee.budget, 120));
  test('cout par demande calcule sur les demandes attribuees quand elles existent',
    () => assert.strictEqual(tracee.coutParDemande, 30));
  test('pas de cout par demande sur une campagne non tracee: on ignore ce qu\'elle a rapporte',
    () => assert.strictEqual(horsLigne.coutParDemande, null));
  test('le plafond de campagnes est annonce',
    () => assert.strictEqual(liste.corps.plafond, 12));
  test('le nombre reel de campagnes est renvoye',
    () => assert.strictEqual(liste.corps.total, 2));

  console.log('\nCampagnes : stockage non configure');
  delete process.env.SUPABASE_URL;
  const nonConfig = await appel({ motDePasse: MDP, action: 'campagnes' });
  test('erreur explicite plutot qu\'une liste vide trompeuse',
    () => assert.strictEqual(nonConfig.code, 500));

  console.log('\n' + ok + ' verifications passees.');
})();
