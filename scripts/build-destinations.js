#!/usr/bin/env node
// Génère les pages « destinations » (web/<slug>.html) à partir de scripts/destinations.json.
// Zéro dépendance, à relancer après toute modification du JSON ou de ce gabarit :
//   node scripts/build-destinations.js
// Les pages générées sont versionnées (site statique, aucune étape de build sur Vercel).
'use strict';
const fs = require('fs');
const path = require('path');

const RACINE = path.join(__dirname, '..');
const DATA = JSON.parse(fs.readFileSync(path.join(__dirname, 'destinations.json'), 'utf8'));
const SITE = 'https://rb-capso.com';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const jsonLd = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

function page(p, commun) {
  const url = `${SITE}/${p.slug}`;
  const vans = commun.vans.map((v) => `
        <article class="carte">
          <div class="carte-type">${esc(v.type)}</div>
          <h3>${esc(v.nom)}</h3>
          <p>${esc(v.texte)}</p>
          <p class="carte-prix"><span class="carte-des">à partir de</span> ${v.prix} € <span class="carte-jour">/ jour</span></p>
          <a class="lien-fleche" href="/#vans">Voir les disponibilités<span class="sr-only"> de ${esc(v.nom)}</span></a>
        </article>`).join('');
  const spots = p.spots.map((s) => `
        <li><strong>${esc(s.nom)}.</strong> ${esc(s.texte)}</li>`).join('');
  const etapes = commun.etapes.map((e) => `
        <li><strong>${esc(e.titre)}.</strong> ${esc(e.texte)}</li>`).join('');
  const faq = p.faq.map((f) => `
        <details class="faq"><summary>${esc(f.q)}</summary><p>${esc(f.r)}</p></details>`).join('');

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'WebPage', name: p.titre, url, description: p.meta, inLanguage: 'fr-FR',
      isPartOf: { '@type': 'WebSite', name: 'RB-CapSO', url: SITE + '/' },
      about: { '@type': 'Service', name: 'Location de van aménagé', provider: { '@type': 'LocalBusiness', name: 'RB-CapSO', address: { '@type': 'PostalAddress', streetAddress: '9 rue du Hapchot', postalCode: '40130', addressLocality: 'Capbreton', addressCountry: 'FR' }, telephone: '+33685757566', url: SITE + '/' } },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE + '/' },
        { '@type': 'ListItem', position: 2, name: 'Destinations', item: SITE + '/#destinations' },
        { '@type': 'ListItem', position: 3, name: p.ville, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: p.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.r } })),
    },
  ];

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(p.titre)} | RB-CapSO</title>
<meta name="description" content="${esc(p.meta)}">
<meta name="robots" content="index,follow,max-image-preview:large">
<link rel="canonical" href="${url}">
<meta property="og:type" content="website">
<meta property="og:locale" content="fr_FR">
<meta property="og:site_name" content="RB-CapSO">
<meta property="og:title" content="${esc(p.titre)} | RB-CapSO">
<meta property="og:description" content="${esc(p.meta)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${SITE}/og-cover.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png">
<link rel="icon" type="image/png" sizes="192x192" href="/favicon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"></noscript>
<link rel="stylesheet" href="/destinations.css">
<script type="application/ld+json">${jsonLd(ld)}</script>
</head>
<body>
<a class="skip-link" href="#contenu">Aller au contenu</a>
<header class="entete">
  <nav class="nav" aria-label="Principale">
    <a href="/" class="nav-logo"><img src="/assets/logo-rbcapso.svg" alt="" width="44" height="44" decoding="async"><span class="nav-wordmark">RB<span>-CapSO</span></span></a>
    <ul class="nav-liens">
      <li><a href="/#vans">Nos vans</a></li>
      <li><a href="/#destinations">Destinations</a></li>
      <li><a href="/#contact">Contact</a></li>
      <li><a href="/#vans" class="nav-cta">Réserver</a></li>
    </ul>
  </nav>
</header>
<main id="contenu" tabindex="-1">
  <nav class="ariane" aria-label="Fil d'Ariane">
    <ol><li><a href="/">Accueil</a></li><li><a href="/#destinations">Destinations</a></li><li aria-current="page">${esc(p.ville)}</li></ol>
  </nav>
  <section class="hero-page">
    <div class="etiquette">Destination</div>
    <h1>${esc(p.titre)}</h1>
    <p class="accroche">${esc(p.accroche)}</p>
    <p class="intro">${esc(p.intro)}</p>
    <div class="actions"><a class="btn-plein" href="/#vans">Voir les vans et réserver</a><a class="btn-ligne" href="${esc(commun.whatsapp)}" target="_blank" rel="noopener">Poser une question sur WhatsApp<span class="sr-only"> (nouvelle fenêtre)</span></a></div>
  </section>

  <section class="bloc" aria-labelledby="depuis">
    <div class="etiquette">Depuis l'atelier</div>
    <h2 id="depuis">Au départ de Capbreton</h2>
    <dl class="infos">
      <div><dt>Distance</dt><dd>${esc(p.distance)}</dd></div>
      <div><dt>Temps de route</dt><dd>${esc(p.temps)}</dd></div>
      <div><dt>Itinéraire</dt><dd>${esc(p.route)}</dd></div>
      <div><dt>Remise des clés</dt><dd>${esc(commun.atelier)}</dd></div>
    </dl>
  </section>

  <section class="bloc" aria-labelledby="vans">
    <div class="etiquette">Nos véhicules</div>
    <h2 id="vans">Trois façons de partir</h2>
    <p class="sous-titre">Les prix « à partir de » sont ceux de l'hiver ; l'estimation exacte s'affiche dans le calendrier selon vos dates.</p>
    <div class="cartes">${vans}
    </div>
  </section>

  <section class="bloc" aria-labelledby="spots">
    <div class="etiquette">Idées</div>
    <h2 id="spots">Nos spots autour de ${esc(p.ville)}</h2>
    <ul class="liste">${spots}
    </ul>
  </section>

  <section class="bloc" aria-labelledby="comment">
    <div class="etiquette">En pratique</div>
    <h2 id="comment">Comment ça marche</h2>
    <ol class="liste etapes">${etapes}
    </ol>
  </section>

  <section class="bloc" aria-labelledby="questions">
    <div class="etiquette">Questions</div>
    <h2 id="questions">On nous demande souvent</h2>${faq}
  </section>

  <section class="final">
    <h2>Prêts pour ${esc(p.ville)} ?</h2>
    <p>Le calendrier montre les disponibilités en direct. Romain répond sous 24 à 48 h.</p>
    <div class="actions"><a class="btn-plein" href="/#vans">Réserver un van</a><a class="btn-ligne" href="${esc(commun.telephone_lien)}">Appeler le ${esc(commun.telephone)}</a></div>
  </section>
</main>
<footer class="pied">
  <div class="pied-haut">
    <div>
      <a href="/" class="nav-logo pied-logo"><img src="/assets/logo-rbcapso.svg" alt="" width="44" height="44" loading="lazy" decoding="async"><span class="nav-wordmark">RB<span>-CapSO</span></span></a>
      <p>Vans aménagés fabriqués main à Capbreton. ${esc(commun.atelier)}.</p>
    </div>
    <ul class="pied-liens" aria-label="Autres destinations">
      ${DATA.pages.filter((q) => q.slug !== p.slug).map((q) => `<li><a href="/${q.slug}">${esc(q.titre_court)}</a></li>`).join('')}
    </ul>
    <ul class="pied-liens" aria-label="Site">
      <li><a href="/#vans">Nos vans</a></li><li><a href="/#apropos">À propos</a></li><li><a href="/#contact">Contact</a></li>
    </ul>
  </div>
  <div class="pied-bas">
    <span>© 2026 RB-CapSO · Romain Bausseron</span>
    <span class="pied-legal"><a href="/#legal-mentions">Mentions légales</a><a href="/#legal-cgv">CGV</a><a href="/#legal-confidentialite">Confidentialité</a><a href="/#legal-cookies">Cookies</a></span>
  </div>
</footer>
</body>
</html>
`;
}

let n = 0;
for (const p of DATA.pages) {
  const html = page(p, DATA.commun);
  fs.writeFileSync(path.join(RACINE, 'web', p.slug + '.html'), html);
  n++;
}
console.log(n + ' page(s) générée(s) : ' + DATA.pages.map((p) => p.slug).join(', '));
