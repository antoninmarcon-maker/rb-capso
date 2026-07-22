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
// Posee expres: depuis la decision du 23/07 elle doit etre IGNOREE partout.
process.env.STATS_BUDGET_ADS = '34,10';

const REPONSE_GA4 = {
  reports: [
    { rows: [{ metricValues: [{ value: '1247' }, { value: '1502' }, { value: '134.7' }] }] },
    { rows: [
      { dimensionValues: [{ value: 'Organic Search' }], metricValues: [{ value: '612' }] },
      { dimensionValues: [{ value: 'Direct' }], metricValues: [{ value: '324' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'clic_telephone' }, { value: '(not set)' }], metricValues: [{ value: '47' }] },
      { dimensionValues: [{ value: 'clic_whatsapp' }, { value: '(not set)' }], metricValues: [{ value: '89' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'penelop' }], metricValues: [{ value: '7' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'peggy' }], metricValues: [{ value: '5' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'test' }], metricValues: [{ value: '2' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'penelop' }], metricValues: [{ value: '44' }] },
      { dimensionValues: [{ value: 'vans' }], metricValues: [{ value: '96' }] },
      { dimensionValues: [{ value: '(not set)' }], metricValues: [{ value: '3' }] }
    ] }
  ]
};

// Rapport Ads modifiable par test: cout > 0 = lien Ads actif ; cout 0 = pas
// de lien, la fonction doit retomber sur le budget manuel.
let coutAds = '128.4';
const rapportAds = () => ({
  rows: [{ metricValues: [{ value: coutAds }, { value: '640' }, { value: '18000' }] }]
});

const REPONSE_COMPLEMENT = () => ({
  reports: [
    { rows: [
      { dimensionValues: [{ value: 'Bordeaux' }], metricValues: [{ value: '210' }] },
      { dimensionValues: [{ value: '(not set)' }], metricValues: [{ value: '64' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'Nouvelle-Aquitaine' }], metricValues: [{ value: '480' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'mobile' }], metricValues: [{ value: '890' }] },
      { dimensionValues: [{ value: 'desktop' }], metricValues: [{ value: '312' }] }
    ] },
    rapportAds()
  ]
});

// Cle du jour au meme format que l'API (UTC, AAAAMMJJ), pour que le point
// du mock tombe dans la fenetre de la serie generee par la fonction.
function cleJour(decalage) {
  const d = new Date(Date.now() - (decalage || 0) * 86400000);
  return d.getUTCFullYear() +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0');
}

const REPONSE_DETAIL = () => ({
  reports: [
    { rows: [
      { dimensionValues: [{ value: 'Location Vans Aménagés' }],
        metricValues: [{ value: '52.8' }, { value: '210' }, { value: '188' }] },
      { dimensionValues: [{ value: '(not set)' }],
        metricValues: [{ value: '0' }, { value: '0' }, { value: '900' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'penelop' }, { value: 'Location Vans Aménagés' }],
        metricValues: [{ value: '3' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'test' }, { value: 'Location Vans Aménagés' }],
        metricValues: [{ value: '1' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'peggy' }, { value: '(not set)' }],
        metricValues: [{ value: '9' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: cleJour(0) }], metricValues: [{ value: '100' }] },
      { dimensionValues: [{ value: cleJour(2) }], metricValues: [{ value: '40' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: cleJour(0) }, { value: 'demande_reservation' }, { value: 'penelop' }],
        metricValues: [{ value: '2' }] },
      { dimensionValues: [{ value: cleJour(0) }, { value: 'demande_reservation' }, { value: 'test' }],
        metricValues: [{ value: '1' }] }
    ] }
  ]
});

const REPONSE_ENTONNOIR = () => ({
  reports: [
    { rows: [
      { dimensionValues: [{ value: 'section_vue' }, { value: 'vans' }], metricValues: [{ value: '640' }] },
      { dimensionValues: [{ value: 'section_vue' }, { value: 'contact' }], metricValues: [{ value: '210' }] }
    ] },
    { rows: [
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'penelop' }], metricValues: [{ value: '11' }] },
      { dimensionValues: [{ value: 'demande_reservation' }, { value: 'test' }], metricValues: [{ value: '2' }] }
    ] }
  ]
});

let appelsGA4 = [];
let echouerGeo = false;
let echouerDetail = false;
let echouerEntonnoir = false;
global.fetch = async function (url, options) {
  if (String(url).indexOf('oauth2.googleapis.com') > -1) {
    return { ok: true, status: 200, json: async () => ({ access_token: 'jeton-factice' }) };
  }
  const envoye = JSON.parse(options.body);
  appelsGA4.push(envoye);
  // Les deux lots portent 4 requetes: on les distingue par le contenu. Le
  // complement commence par une dimension (ville), le lot principal non.
  const premiereDim = envoye.requests[0].dimensions &&
    envoye.requests[0].dimensions[0].name;
  if (premiereDim === 'sessionGoogleAdsCampaignName') {
    if (echouerDetail) return { ok: false, status: 500, text: async () => 'detail indisponible' };
    return { ok: true, status: 200, json: async () => REPONSE_DETAIL() };
  }
  if (premiereDim === 'eventName') {
    if (echouerEntonnoir) return { ok: false, status: 500, text: async () => 'entonnoir indisponible' };
    return { ok: true, status: 200, json: async () => REPONSE_ENTONNOIR() };
  }
  const estComplement = premiereDim === 'city';
  if (estComplement) {
    if (echouerGeo) return { ok: false, status: 500, text: async () => 'complement indisponible' };
    return { ok: true, status: 200, json: async () => REPONSE_COMPLEMENT() };
  }
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

  console.log('\nFreinage des tentatives');
  const t0 = Date.now();
  await appel({ motDePasse: 'encore-faux' });
  test('un echec coute au moins 900 ms, rendant le dictionnaire impraticable',
    () => assert.ok(Date.now() - t0 >= 900, 'delai mesure: ' + (Date.now() - t0) + ' ms'));
  const t1 = Date.now();
  await appel({ motDePasse: 'motdepasse-de-test' });
  test('un acces valide n\'est pas ralenti',
    () => assert.ok(Date.now() - t1 < 500, 'delai mesure: ' + (Date.now() - t1) + ' ms'));

  console.log('\nAcces valide');
  const r = await appel({ motDePasse: 'motdepasse-de-test' });
  test('renvoie 200', () => assert.strictEqual(r.code, 200));
  test('visiteurs remontes', () => assert.strictEqual(r.corps.visiteurs, 1247));
  test('sessions remontees', () => assert.strictEqual(r.corps.sessions, 1502));
  test('demandes isolees des clics et sommees par vehicule (7+5)',
    () => assert.strictEqual(r.corps.demandes, 12));
  test('les demandes de TEST (vehicule=test) sont ecartees du compteur',
    () => assert.ok(r.corps.demandes === 12, '12 attendu, la ligne test=2 ne doit pas s\'ajouter'));
  test('clic telephone', () => assert.strictEqual(r.corps.clics.telephone, 47));
  test('clic whatsapp', () => assert.strictEqual(r.corps.clics.whatsapp, 89));
  test('clic absent vaut 0, pas undefined', () => assert.strictEqual(r.corps.clics.email, 0));
  test('sources ordonnees', () => assert.strictEqual(r.corps.sources[0].nom, 'Organic Search'));

  console.log('\nDepense pub via Google Ads');
  test('depense reelle Ads remontee de GA4 quand le lien est actif',
    () => assert.strictEqual(r.corps.ads.montant, 128.4));
  test('source auto quand la depense vient de Google Ads',
    () => assert.strictEqual(r.corps.ads.source, 'auto'));
  test('clics et impressions Ads remontes',
    () => assert.strictEqual(r.corps.ads.clics, 640));
  test('le budget saisi a la main est ignore, seul le reel compte',
    () => assert.notStrictEqual(r.corps.ads.montant, 34.10));

  console.log('\nVisites, temps moyen, parcours');
  test('les visites (sessions) sont exposees', () => assert.strictEqual(r.corps.sessions, 1502));
  test('le temps moyen de visite est arrondi a la seconde',
    () => assert.strictEqual(r.corps.dureeMoyenneSec, 135));
  test('entonnoir palier 1 = visiteurs', () => assert.strictEqual(r.corps.entonnoir[0].valeur, 1247));
  test('entonnoir: personnes ayant vu les vans',
    () => assert.strictEqual(r.corps.entonnoir[1].valeur, 640));
  test('entonnoir: personnes ayant vu la zone contact',
    () => assert.strictEqual(r.corps.entonnoir[2].valeur, 210));
  test('entonnoir: demandes en personnes, test ecarte (11, pas 13)',
    () => assert.strictEqual(r.corps.entonnoir[3].valeur, 11));

  console.log('\nPanne de l\'entonnoir seule');
  echouerEntonnoir = true;
  const sansEnt = await appel({ motDePasse: 'motdepasse-de-test' });
  echouerEntonnoir = false;
  test('la page reste servie sans l\'entonnoir', () => assert.strictEqual(sansEnt.code, 200));
  test('l\'entonnoir est vide, pas fabrique',
    () => assert.deepStrictEqual(sansEnt.corps.entonnoir, []));

  console.log('\nCampagnes Google Ads automatiques');
  test('la campagne decouverte dans GA4 apparait sans saisie',
    () => assert.strictEqual(r.corps.campagnesAds[0].nom, 'Location Vans Aménagés'));
  test('sa depense reelle est remontee', () => assert.strictEqual(r.corps.campagnesAds[0].depense, 52.8));
  test('ses demandes excluent le test (3, pas 4)',
    () => assert.strictEqual(r.corps.campagnesAds[0].demandes, 3));
  test('son cout par demande = depense / demandes attribuees (52.8/3)',
    () => assert.strictEqual(r.corps.campagnesAds[0].coutParDemande, 17.6));
  test('(not set) n\'est pas une campagne',
    () => assert.ok(!r.corps.campagnesAds.some(c => c.nom === '(not set)')));
  test('demandes venues de la pub: hors test et hors trafic gratuit',
    () => assert.strictEqual(r.corps.demandesPub, 3));
  test('cout par demande global = depense totale / demandes pub (128.4/3)',
    () => assert.strictEqual(r.corps.coutParDemande, 42.8));

  console.log('\nSerie jour par jour');
  test('un point par jour de la periode, zeros compris',
    () => assert.strictEqual(r.corps.serie.length, 31));
  test('le point du jour porte les visiteurs du mock',
    () => assert.strictEqual(r.corps.serie[r.corps.serie.length - 1].visiteurs, 100));
  test('les demandes du jour excluent le test (2, pas 3)',
    () => assert.strictEqual(r.corps.serie[r.corps.serie.length - 1].demandes, 2));
  test('un jour sans donnees vaut zero, pas un trou',
    () => assert.strictEqual(r.corps.serie[r.corps.serie.length - 2].visiteurs, 0));

  console.log('\nPanne du detail seule');
  echouerDetail = true;
  const sansDetail = await appel({ motDePasse: 'motdepasse-de-test' });
  echouerDetail = false;
  test('la page reste servie sans le detail', () => assert.strictEqual(sansDetail.code, 200));
  test('les campagnes auto sont vides, pas une erreur',
    () => assert.deepStrictEqual(sansDetail.corps.campagnesAds, []));
  test('la serie est vide, pas fabriquee',
    () => assert.deepStrictEqual(sansDetail.corps.serie, []));

  console.log('\nSeparation vans / sections');
  test('slug de van traduit en nom lisible',
    () => assert.strictEqual(r.corps.vans[0].nom, 'Pénélope'));
  test('une section de page ne finit pas dans les vans',
    () => assert.ok(!r.corps.vans.some(v => v.nom === 'vans')));
  test('la section vans est classee a part',
    () => assert.ok(r.corps.sections.some(s => s.nom === 'vans')));
  test('(not set) est ecarte',
    () => assert.ok(!r.corps.vans.some(v => v.nom === '(not set)')));

  console.log('\nGeographie et appareils');
  test('villes remontees', () => assert.strictEqual(r.corps.villes[0].nom, 'Bordeaux'));
  test('regions remontees', () => assert.strictEqual(r.corps.regions[0].nom, 'Nouvelle-Aquitaine'));
  test('appareils remontes en valeur brute, traduits cote page',
    () => assert.strictEqual(r.corps.appareils[0].nom, 'mobile'));
  test('(not set) renomme plutot que masque: masquer ferait mentir les totaux',
    () => assert.strictEqual(r.corps.villes[1].nom, 'Non localisé'));
  test('le second lot tient dans la limite GA4 de 5 requetes',
    () => assert.ok(appelsGA4.every(a => a.requests.length <= 5)));

  console.log('\nPanne de la geographie seule');
  echouerGeo = true;
  const sansGeo = await appel({ motDePasse: 'motdepasse-de-test' });
  echouerGeo = false;
  test('la page reste servie', () => assert.strictEqual(sansGeo.code, 200));
  test('les visiteurs restent la', () => assert.strictEqual(sansGeo.corps.visiteurs, 1247));
  test('les clics restent la', () => assert.strictEqual(sansGeo.corps.clics.telephone, 47));
  test('la geographie est vide, pas absente',
    () => assert.deepStrictEqual(sansGeo.corps.villes, []));
  test('sans complement, pas de depense inventee: ads vaut null',
    () => assert.strictEqual(sansGeo.corps.ads, null));

  console.log('\nSynchro Ads pas encore propagee');
  coutAds = '0';
  const sansAds = await appel({ motDePasse: 'motdepasse-de-test' });
  test('depense a zero: ads vaut null, jamais le budget saisi (decision 23/07)',
    () => assert.strictEqual(sansAds.corps.ads, null));
  test('geographie toujours presente meme sans depense Ads',
    () => assert.strictEqual(sansAds.corps.villes[0].nom, 'Bordeaux'));

  console.log('\nMontant Ads: arrondi et entrees degradees');
  coutAds = '12.3456';
  const arrondi = await appel({ motDePasse: 'motdepasse-de-test' });
  test('un cout a decimales longues est arrondi au centime',
    () => assert.strictEqual(arrondi.corps.ads.montant, 12.35));

  coutAds = '128.4';

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
      { rows: [
        { dimensionValues: [{ value: 'demande_reservation' }, { value: 'penelop' }], metricValues: [{ value: '9' }] },
        { dimensionValues: [{ value: 'demande_reservation' }, { value: 'test' }], metricValues: [{ value: '2' }] }
      ] }
    ];
    if (envoye.requests.length === 4) {
      rapports.push({ rows: [{ metricValues: [{ value: '137' }] }] });
      rapports.push({ rows: [{ dimensionValues: [{ value: 'demande_reservation' }, { value: 'penelop' }], metricValues: [{ value: '4' }] }] });
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
  test('campagne: les demandes de test sont ecartees du site aussi',
    () => assert.strictEqual(tracee.site.demandes, 9));
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
