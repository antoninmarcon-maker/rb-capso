/*
 * Fonction serverless qui alimente /stats, le tableau de bord de Romain.
 *
 * Pourquoi une fonction et pas du JavaScript dans la page: l'API GA4 exige
 * un compte de service et une cle privee. Cette cle ne peut pas vivre dans
 * le HTML, sinon n'importe qui aspire les donnees. Elle reste ici, cote
 * serveur, et la page ne recoit que des nombres deja calcules.
 *
 * Zero dependance: node:crypto signe le JWT, fetch est natif. Un site
 * statique n'a pas de package.json et n'a pas besoin d'en gagner un.
 *
 * Variables d'environnement Vercel (aucune dans le depot, il est public):
 *   STATS_PASSWORD    mot de passe donne a Romain
 *   GA_PROPERTY_ID    identifiant numerique de la propriete GA4
 *   GA_SA_EMAIL       email du compte de service
 *   GA_SA_KEY         cle privee du compte de service (avec des \n litteraux)
 *   STATS_BUDGET_ADS  budget publicitaire saisi a la main, optionnel
 */

const crypto = require('node:crypto');

const SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';

const EVENEMENTS_CLIC = {
  clic_telephone: 'telephone',
  clic_email: 'email',
  clic_whatsapp: 'whatsapp',
  clic_instagram: 'instagram'
};

function base64url(input) {
  return Buffer.from(input).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/*
 * Compare en temps constant. Un === classique s'arrete au premier caractere
 * different, ce qui laisse mesurer le mot de passe caractere par caractere.
 */
function memeMotDePasse(fourni, attendu) {
  const a = Buffer.from(String(fourni));
  const b = Buffer.from(String(attendu));
  if (a.length !== b.length) {
    // timingSafeEqual exige des longueurs egales: on compare quand meme
    // quelque chose pour ne pas repondre plus vite sur une longueur fausse.
    crypto.timingSafeEqual(a, a);
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

async function jetonAcces(email, cleBrute) {
  const cle = String(cleBrute).replace(/\\n/g, '\n');
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const charge = base64url(JSON.stringify({
    iss: email, scope: SCOPE, aud: TOKEN_URL,
    iat: maintenant, exp: maintenant + 3600
  }));
  const signature = crypto.createSign('RSA-SHA256')
    .update(entete + '.' + charge).sign(cle);
  const jwt = entete + '.' + charge + '.' +
    signature.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });
  if (!r.ok) throw new Error('token ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return (await r.json()).access_token;
}

function periode(jours) {
  return [{ startDate: jours + 'daysAgo', endDate: 'today' }];
}

async function rapports(jeton, propriete, jours) {
  const corps = {
    requests: [
      // 0. Visiteurs et sessions
      {
        dateRanges: periode(jours),
        metrics: [{ name: 'activeUsers' }, { name: 'sessions' }]
      },
      // 1. D'ou viennent les visiteurs
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 6
      },
      // 2. Les evenements qui comptent (clics + demandes)
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: Object.keys(EVENEMENTS_CLIC).concat('demande_reservation')
            }
          }
        }
      },
      // 3. Quel van interesse
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'customEvent:section' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            stringFilter: { value: 'section_vue' }
          }
        },
        orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
        limit: 12
      }
    ]
  };

  const r = await fetch(
    'https://analyticsdata.googleapis.com/v1beta/properties/' + propriete + ':batchRunReports',
    {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' },
      body: JSON.stringify(corps)
    }
  );
  if (!r.ok) throw new Error('ga4 ' + r.status + ' ' + (await r.text()).slice(0, 300));
  return (await r.json()).reports || [];
}

const nombre = (v) => Number(v || 0);

function lignes(rapport) {
  return (rapport && rapport.rows) || [];
}

// Les slugs sont ceux de la reservation (voir web/index.html), pas des noms
// affichables. On traduit ici plutot que dans la page, pour qu'un ajout de
// vehicule ne demande de toucher qu'un seul endroit.
const NOMS_VANS = {
  penelop: 'Pénélope',
  peggy: 'Peggy',
  tente: 'Tente de toit',
  pamela: 'Pamela'
};
const SECTIONS_HORS_VANS = ['vans', 'conception', 'apropos', 'faq', 'contact', 'devis'];

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ erreur: 'methode non autorisee' });
  }

  const attendu = process.env.STATS_PASSWORD;
  const propriete = process.env.GA_PROPERTY_ID;
  const email = process.env.GA_SA_EMAIL;
  const cle = process.env.GA_SA_KEY;

  if (!attendu || !propriete || !email || !cle) {
    // Message explicite: c'est une erreur de configuration, pas de l'utilisateur.
    return res.status(500).json({ erreur: 'Configuration serveur incomplete.' });
  }

  let corps = req.body;
  if (typeof corps === 'string') {
    try { corps = JSON.parse(corps); } catch (e) { corps = {}; }
  }

  if (!corps || !memeMotDePasse(corps.motDePasse || '', attendu)) {
    return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
  }

  const jours = [7, 30, 90].includes(Number(corps.jours)) ? Number(corps.jours) : 30;

  try {
    const jeton = await jetonAcces(email, cle);
    const r = await rapports(jeton, propriete, jours);

    const total = lignes(r[0])[0];
    const clics = { telephone: 0, email: 0, whatsapp: 0, instagram: 0 };
    let demandes = 0;

    lignes(r[2]).forEach(function (ligne) {
      const nom = ligne.dimensionValues[0].value;
      const n = nombre(ligne.metricValues[0].value);
      if (nom === 'demande_reservation') demandes = n;
      else if (EVENEMENTS_CLIC[nom]) clics[EVENEMENTS_CLIC[nom]] = n;
    });

    const vans = [];
    const sections = [];
    lignes(r[3]).forEach(function (ligne) {
      const slug = ligne.dimensionValues[0].value;
      const n = nombre(ligne.metricValues[0].value);
      if (SECTIONS_HORS_VANS.includes(slug)) sections.push({ nom: slug, valeur: n });
      else if (slug && slug !== '(not set)') vans.push({ nom: NOMS_VANS[slug] || slug, valeur: n });
    });

    return res.status(200).json({
      jours: jours,
      visiteurs: total ? nombre(total.metricValues[0].value) : 0,
      sessions: total ? nombre(total.metricValues[1].value) : 0,
      sources: lignes(r[1]).map(function (l) {
        return { nom: l.dimensionValues[0].value, valeur: nombre(l.metricValues[0].value) };
      }),
      clics: clics,
      demandes: demandes,
      vans: vans,
      sections: sections,
      budgetAds: process.env.STATS_BUDGET_ADS || null
    });
  } catch (e) {
    // On ne renvoie jamais le detail au navigateur: il contiendrait des
    // fragments de reponse Google, voire des identifiants.
    console.error('stats:', e && e.message);
    return res.status(502).json({ erreur: 'Impossible de recuperer les donnees pour le moment.' });
  }
};
