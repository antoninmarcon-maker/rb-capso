/*
 * Bandeau de consentement RGPD/CNIL, partage par les 3 pages du site.
 *
 * Les valeurs par defaut de Consent Mode v2 ne sont PAS ici: elles doivent
 * s'executer avant le snippet GTM, donc elles sont inlinees dans le <head>
 * de chaque page. Ce fichier ne gere que l'interface et la mise a jour du
 * choix. Charge en defer, il peut arriver apres GTM sans rien casser: tant
 * que l'utilisateur n'a pas accepte, les tags restent bloques par le default
 * "denied".
 *
 * ponytail: un seul niveau de consentement (tout ou rien). Si Romain ajoute
 * un jour de la pub ou des tags tiers qui demandent un choix granulaire,
 * passer a des cases par categorie ici meme.
 */
(function () {
  'use strict';

  var KEY = 'rbcapso_consent';
  var GRANTED = {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted'
  };
  var DENIED = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied'
  };

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* navigation privee */ }
  }

  function gtag() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(arguments);
  }

  function apply(value) {
    gtag('consent', 'update', value === 'granted' ? GRANTED : DENIED);
    // Evenement dedie: permet de declencher les tags GTM au moment exact du
    // consentement, sans attendre le prochain chargement de page.
    window.dataLayer.push({ event: 'rb_consent_' + value });
  }

  var banner = null;

  function close() {
    if (!banner) return;
    banner.parentNode.removeChild(banner);
    banner = null;
  }

  function decide(value) {
    write(value);
    apply(value);
    close();
  }

  function styles() {
    if (document.getElementById('rb-consent-style')) return;
    var css = [
      '.rb-consent{position:fixed;left:0;right:0;bottom:0;z-index:9999;',
      'background:#F5F0E8;border-top:1px solid #E8DFC8;',
      'box-shadow:0 -2px 24px rgba(26,24,21,.10);',
      "font-family:'DM Sans',sans-serif;color:#1A1815;",
      'padding:20px clamp(16px,4vw,48px);',
      'display:flex;flex-wrap:wrap;align-items:center;gap:16px 24px;',
      'animation:rb-consent-in .3s ease-out}',
      '@keyframes rb-consent-in{from{transform:translateY(100%)}to{transform:none}}',
      '@media(prefers-reduced-motion:reduce){.rb-consent{animation:none}}',
      '.rb-consent p{margin:0;flex:1 1 320px;font-size:14px;line-height:1.6;color:#6B6459}',
      '.rb-consent strong{color:#1A1815;font-weight:500}',
      '.rb-consent-actions{display:flex;gap:12px;flex-wrap:wrap;align-items:center}',
      '.rb-consent button{font-family:inherit;font-size:14px;font-weight:500;',
      'cursor:pointer;border-radius:100px;transition:all .2s;border:none}',
      '.rb-consent .rb-accept{background:#2C5F6E;color:#FDFCF9;padding:12px 28px}',
      '.rb-consent .rb-accept:hover{background:#4A8FA0;transform:translateY(-1px)}',
      '.rb-consent .rb-refuse{background:none;color:#6B6459;padding:12px 16px;',
      'text-decoration:underline;text-underline-offset:3px}',
      '.rb-consent .rb-refuse:hover{color:#1A1815}',
      '.rb-consent button:focus-visible{outline:2px solid #C07840;outline-offset:2px}'
    ].join('');
    var el = document.createElement('style');
    el.id = 'rb-consent-style';
    el.textContent = css;
    document.head.appendChild(el);
  }

  function show() {
    if (banner) return;
    styles();

    banner = document.createElement('div');
    banner.className = 'rb-consent';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentement aux cookies de mesure');

    var text = document.createElement('p');
    var lead = document.createElement('strong');
    lead.textContent = 'On compte les visites, rien de plus.';
    text.appendChild(lead);
    text.appendChild(document.createTextNode(
      ' Ces cookies de mesure nous disent combien de personnes consultent le ' +
      'site et ce qui les intéresse, pour l\'améliorer. Aucune donnée revendue.'
    ));

    var actions = document.createElement('div');
    actions.className = 'rb-consent-actions';

    var refuse = document.createElement('button');
    refuse.type = 'button';
    refuse.className = 'rb-refuse';
    refuse.textContent = 'Refuser';
    refuse.addEventListener('click', function () { decide('denied'); });

    var accept = document.createElement('button');
    accept.type = 'button';
    accept.className = 'rb-accept';
    accept.textContent = 'Accepter';
    accept.addEventListener('click', function () { decide('granted'); });

    // Refuser avant Accepter dans le DOM: la CNIL demande que refuser soit
    // aussi accessible qu'accepter, y compris au clavier.
    actions.appendChild(refuse);
    actions.appendChild(accept);
    banner.appendChild(text);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    accept.focus();
  }

  // Retrait du consentement: la CNIL impose que ce soit aussi simple que de
  // l'accorder. Expose pour le lien "Gestion des cookies" du pied de page.
  window.rbConsent = {
    open: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* noop */ }
      apply('denied');
      show();
    },
    status: function () { return read() || 'unset'; }
  };

  if (!read()) show();
})();
