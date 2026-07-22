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
      // 2. Les evenements qui comptent (clics + demandes). La dimension
      //    vehicule sert a ecarter les demandes de TEST (vehicule=test,
      //    poussees les 21-22/07 pour activer la balise Ads): sans ce
      //    filtre, Romain verrait des demandes qui n'existent pas. L'API
      //    GA4 exigeant qu'une dimension filtree soit aussi demandee, on
      //    l'ajoute au rapport et on ecarte 'test' a l'agregation.
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'eventName' }, { name: 'customEvent:vehicule' }],
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

/*
 * Second lot: d'ou se connectent les visiteurs et sur quel appareil.
 * GA4 plafonne batchRunReports a 5 requetes et le premier lot en utilise
 * deja 4. Un deuxieme appel coute un aller-retour, mais sacrifier une
 * mesure existante pour faire tenir celles-ci serait pire.
 */
async function rapportsComplement(jeton, propriete, jours) {
  const corps = {
    requests: [
      // 0. Villes. GA4 renvoie "(not set)" quand il ne sait pas: on le garde
      //    pour ne pas laisser croire que le total des villes fait le total
      //    des visiteurs, mais on le nomme en clair cote page.
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'city' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8
      },
      // 1. Regions: la maille utile pour decider ou placer un budget pub.
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'region' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8
      },
      // 2. Appareils.
      {
        dateRanges: periode(jours),
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }]
      },
      // 3. Depense publicitaire, importee de Google Ads DANS GA4 quand le lien
      //    est actif. C'est ce qui "connecte" le dashboard aux Ads sans passer
      //    par l'API Google Ads (qui exige un developer token valide a la main).
      //    Renvoie 0 si le lien n'est pas actif ou si la campagne tourne sur un
      //    compte Ads non associe a la propriete: dans ce cas on retombe sur le
      //    budget saisi a la main, jamais d'erreur.
      {
        dateRanges: periode(jours),
        metrics: [
          { name: 'advertiserAdCost' },
          { name: 'advertiserAdClicks' },
          { name: 'advertiserAdImpressions' }
        ]
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
  if (!r.ok) throw new Error('ga4 complement ' + r.status + ' ' + (await r.text()).slice(0, 300));
  return (await r.json()).reports || [];
}

const nombre = (v) => Number(v || 0);

function lignes(rapport) {
  return (rapport && rapport.rows) || [];
}

// Depense publicitaire. Priorite au chiffre reel remonte de Google Ads via
// GA4 (le lien est actif ET la campagne tourne sur le compte associe). Sinon,
// repli sur le budget saisi a la main. On renvoie la SOURCE pour que la page
// dise honnetement d'ou vient le nombre: un "34 EUR" synchronise et un "34 EUR"
// tape a la main ne se valent pas.
function depenseAds(rapport) {
  const l = lignes(rapport)[0];
  const cout = l ? nombre(l.metricValues[0].value) : 0;
  if (cout > 0) {
    return {
      montant: Math.round(cout * 100) / 100,
      clics: l ? nombre(l.metricValues[1].value) : 0,
      impressions: l ? nombre(l.metricValues[2].value) : 0,
      source: 'auto'
    };
  }
  const manuel = process.env.STATS_BUDGET_ADS;
  if (manuel) {
    // Le budget manuel est une chaine libre ("34,10"): on la normalise en
    // nombre. Un budget illisible ("abc") ou negatif est traite comme absent
    // plutot que d'afficher "NaN EUR" ou un montant negatif sous une etiquette
    // "saisi a la main" qui ne montrerait rien de valide. Meme garde >= 0 que
    // le budget de campagne.
    const n = Number(String(manuel).replace(',', '.'));
    if (isFinite(n) && n >= 0) {
      return { montant: n, source: 'manuel' };
    }
  }
  return null;
}

// GA4 ne sait pas toujours renseigner une dimension: "(not set)" est frequent
// et legitime. Le masquer ferait mentir les totaux, on le renomme donc en
// clair. Le libelle depend de la dimension: "Non localise" n'a de sens que
// pour une ville ou une region, pas pour un appareil.
function paires(rapport, inconnu) {
  const etiquette = inconnu || 'Non précisé';
  return lignes(rapport).map(function (l) {
    const brut = l.dimensionValues[0].value;
    return {
      nom: (!brut || brut === '(not set)') ? etiquette : brut,
      valeur: nombre(l.metricValues[0].value)
    };
  });
}

/* ---------- Campagnes ---------- */

// Plafond volontaire: chaque campagne coute un appel GA4. Au-dela, la page
// mettrait plusieurs secondes a s'afficher. Le nombre reellement stocke est
// renvoye a part, pour qu'une troncature ne passe jamais inapercue.
const MAX_CAMPAGNES = 12;

function supabase(chemin, options) {
  const base = process.env.SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_KEY;
  return fetch(base.replace(/\/$/, '') + '/rest/v1/' + chemin, Object.assign({
    headers: {
      apikey: cle,
      Authorization: 'Bearer ' + cle,
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }
  }, options || {}));
}

async function listerCampagnes() {
  const r = await supabase('campagnes?select=*&order=date_debut.desc');
  if (!r.ok) throw new Error('supabase liste ' + r.status);
  return await r.json();
}

/*
 * Deux mesures par campagne, volontairement distinctes:
 *
 *  - "site": toute l'activite du site sur la periode. Ce n'est PAS un
 *    resultat de campagne. Deux campagnes qui se chevauchent affichent le
 *    meme nombre, et additionner ces lignes n'aurait aucun sens. C'est un
 *    contexte, la page le presente comme tel.
 *
 *  - "attribue": uniquement les visiteurs venus de cette campagne, reconnus
 *    par son nom dans GA4. Ce chiffre-la reste juste meme si les periodes se
 *    recouvrent. Une campagne hors ligne n'a pas de nom GA4: on renvoie null,
 *    pas zero, car zero laisserait croire qu'elle n'a rien rapporte.
 */
function requetesCampagne(campagne) {
  const plage = [{ startDate: campagne.date_debut, endDate: campagne.date_fin }];
  // La dimension vehicule permet d'ecarter les demandes de test a
  // l'agregation (voir compteEvenements), comme sur le lot principal.
  const evenements = {
    dimensions: [{ name: 'eventName' }, { name: 'customEvent:vehicule' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        inListFilter: { values: ['demande_reservation', 'clic_telephone', 'clic_whatsapp'] }
      }
    }
  };
  const filtreCampagne = {
    filter: {
      fieldName: 'sessionCampaignName',
      stringFilter: { value: campagne.utm_campaign }
    }
  };

  const requetes = [
    { dateRanges: plage, metrics: [{ name: 'activeUsers' }] },
    Object.assign({ dateRanges: plage }, evenements)
  ];

  if (campagne.utm_campaign) {
    requetes.push({
      dateRanges: plage,
      metrics: [{ name: 'activeUsers' }],
      dimensionFilter: filtreCampagne
    });
    requetes.push({
      dateRanges: plage,
      dimensions: evenements.dimensions,
      metrics: [{ name: 'eventCount' }],
      dimensionFilter: {
        andGroup: {
          expressions: [filtreCampagne, evenements.dimensionFilter]
        }
      }
    });
  }
  return requetes;
}

function compteEvenements(rapport) {
  const c = { demandes: 0, telephone: 0, whatsapp: 0 };
  // Lignes dedoublees par vehicule: on accumule, et on ecarte les demandes
  // de test (vehicule=test) qui ne correspondent a aucune reservation reelle.
  lignes(rapport).forEach(function (l) {
    const nom = l.dimensionValues[0].value;
    const vehicule = l.dimensionValues[1] ? l.dimensionValues[1].value : '';
    const n = nombre(l.metricValues[0].value);
    if (nom === 'demande_reservation') {
      if (vehicule !== 'test') c.demandes += n;
    } else if (nom === 'clic_telephone') c.telephone += n;
    else if (nom === 'clic_whatsapp') c.whatsapp += n;
  });
  return c;
}

async function resultatsCampagnes(jeton, propriete, campagnes) {
  const sortie = [];
  for (const c of campagnes) {
    let site = { visiteurs: 0, demandes: 0, telephone: 0, whatsapp: 0 };
    let attribue = null;
    try {
      const r = await fetch(
        'https://analyticsdata.googleapis.com/v1beta/properties/' + propriete + ':batchRunReports',
        {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + jeton, 'Content-Type': 'application/json' },
          body: JSON.stringify({ requests: requetesCampagne(c) })
        }
      );
      if (r.ok) {
        const rapports = (await r.json()).reports || [];
        const totalLigne = lignes(rapports[0])[0];
        site = Object.assign(
          { visiteurs: totalLigne ? nombre(totalLigne.metricValues[0].value) : 0 },
          compteEvenements(rapports[1])
        );
        if (c.utm_campaign) {
          const attLigne = lignes(rapports[2])[0];
          attribue = Object.assign(
            { visiteurs: attLigne ? nombre(attLigne.metricValues[0].value) : 0 },
            compteEvenements(rapports[3])
          );
        }
      }
    } catch (e) {
      console.error('campagne', c.id, e && e.message);
    }

    const budget = c.budget_cents == null ? null : c.budget_cents / 100;
    // Un cout par demande n'a de sens que sur des demandes reellement
    // attribuees a la campagne. Le calculer sur les demandes de tout le site
    // ferait passer n'importe quelle campagne hors ligne pour redoutablement
    // efficace, alors qu'on ignore ce qu'elle a rapporte. On renvoie null.
    const demandesRetenues = attribue ? attribue.demandes : null;
    sortie.push({
      id: c.id,
      nom: c.nom,
      canal: c.canal,
      debut: c.date_debut,
      fin: c.date_fin,
      budget: budget,
      tracee: Boolean(c.utm_campaign),
      site: site,
      attribue: attribue,
      coutParDemande: budget && demandesRetenues ? Math.round(budget / demandesRetenues * 100) / 100 : null
    });
  }
  return sortie;
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
    // Freinage sur echec. Une fonction serverless est sans etat, on ne peut
    // pas compter les tentatives par IP sans stockage. Une seconde d'attente
    // suffit pourtant a rendre l'attaque par dictionnaire impraticable: elle
    // fait passer 100 000 essais de quelques minutes a plus d'une journee,
    // pour un cout nul sur un usage normal.
    await new Promise(function (r) { setTimeout(r, 1000); });
    return res.status(401).json({ erreur: 'Mot de passe incorrect.' });
  }

  const jours = [7, 30, 90].includes(Number(corps.jours)) ? Number(corps.jours) : 30;
  const action = corps.action || 'stats';

  // Les campagnes vivent dans Supabase. Si ce n'est pas configure, on le dit
  // clairement plutot que de renvoyer une liste vide qui ferait croire a
  // Romain qu'il n'a aucune campagne enregistree.
  if (action !== 'stats') {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return res.status(500).json({ erreur: 'Stockage des campagnes non configure.' });
    }
  }

  try {
    if (action === 'ajouter_campagne') {
      const c = corps.campagne || {};
      const nom = String(c.nom || '').trim();
      if (!nom) return res.status(400).json({ erreur: 'Le nom est obligatoire.' });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(c.debut) || !/^\d{4}-\d{2}-\d{2}$/.test(c.fin)) {
        return res.status(400).json({ erreur: 'Dates invalides.' });
      }
      if (c.fin < c.debut) {
        return res.status(400).json({ erreur: 'La date de fin doit suivre la date de début.' });
      }
      // Le budget arrive en euros depuis le formulaire, il est stocke en
      // centimes: un budget finit toujours par etre additionne, et la virgule
      // flottante fait derailler les additions d'argent.
      let cents = null;
      if (c.budget !== '' && c.budget != null) {
        const euros = Number(String(c.budget).replace(',', '.'));
        if (!isFinite(euros) || euros < 0) {
          return res.status(400).json({ erreur: 'Budget invalide.' });
        }
        cents = Math.round(euros * 100);
      }
      const r = await supabase('campagnes', {
        method: 'POST',
        body: JSON.stringify({
          nom: nom,
          canal: c.canal ? String(c.canal).slice(0, 60) : null,
          date_debut: c.debut,
          date_fin: c.fin,
          budget_cents: cents,
          utm_campaign: c.utm_campaign ? String(c.utm_campaign).trim().slice(0, 120) : null
        })
      });
      if (!r.ok) throw new Error('supabase insert ' + r.status + ' ' + (await r.text()).slice(0, 200));
      return res.status(200).json({ ok: true });
    }

    if (action === 'supprimer_campagne') {
      if (!/^[0-9a-f-]{36}$/i.test(String(corps.id || ''))) {
        return res.status(400).json({ erreur: 'Identifiant invalide.' });
      }
      const r = await supabase('campagnes?id=eq.' + corps.id, { method: 'DELETE' });
      if (!r.ok) throw new Error('supabase delete ' + r.status);
      return res.status(200).json({ ok: true });
    }

    if (action === 'campagnes') {
      const toutes = await listerCampagnes();
      const jeton = await jetonAcces(email, cle);
      const retenues = toutes.slice(0, MAX_CAMPAGNES);
      return res.status(200).json({
        campagnes: await resultatsCampagnes(jeton, propriete, retenues),
        total: toutes.length,
        plafond: MAX_CAMPAGNES
      });
    }

    const jeton = await jetonAcces(email, cle);

    // Les deux lots ne dependent que du jeton: on les lance en parallele
    // plutot qu'en serie, l'ecran est consulte au doigt et chaque aller-retour
    // GA4 compte. Le complement (geo + depense Ads) est volontairement
    // tolerant: son .catch le reduit a une liste vide sans jamais faire
    // echouer la page, et couvre aussi bien un echec reseau qu'une reponse
    // 200 malformee.
    const [r, comp] = await Promise.all([
      rapports(jeton, propriete, jours),
      rapportsComplement(jeton, propriete, jours).catch(function (e) {
        console.error('stats complement:', e && e.message);
        return [];
      })
    ]);

    const total = lignes(r[0])[0];
    const clics = { telephone: 0, email: 0, whatsapp: 0, instagram: 0 };
    let demandes = 0;

    // Les lignes arrivent dedoublees par vehicule (2e dimension): on
    // ACCUMULE, et on ecarte les demandes de test qui gonfleraient le
    // compteur avec des reservations qui n'existent pas.
    lignes(r[2]).forEach(function (ligne) {
      const nom = ligne.dimensionValues[0].value;
      const vehicule = ligne.dimensionValues[1] ? ligne.dimensionValues[1].value : '';
      const n = nombre(ligne.metricValues[0].value);
      if (nom === 'demande_reservation') {
        if (vehicule !== 'test') demandes += n;
      } else if (EVENEMENTS_CLIC[nom]) {
        clics[EVENEMENTS_CLIC[nom]] += n;
      }
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
      villes: paires(comp[0], 'Non localisé'),
      regions: paires(comp[1], 'Non localisé'),
      appareils: paires(comp[2], 'Non précisé'),
      ads: depenseAds(comp[3])
    });
  } catch (e) {
    // On ne renvoie jamais le detail au navigateur: il contiendrait des
    // fragments de reponse Google, voire des identifiants.
    console.error('stats:', e && e.message);
    return res.status(502).json({ erreur: 'Impossible de recuperer les donnees pour le moment.' });
  }
};
