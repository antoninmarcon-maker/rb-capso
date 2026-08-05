/*
 * Verification des messages transitoires annonces aux lecteurs d'ecran.
 * Lancer:  node web/live-regions.test.js
 *
 * Zero dependance, comme le reste du projet.
 *
 * Les fonctions vivent dans des <script> inline. On les extrait des fichiers
 * reels et on les evalue sur un DOM factice: le test porte donc sur le code
 * effectivement livre, pas sur une copie qui pourrait diverger.
 *
 * Le bug couvert ici est invisible a l'oeil: une live region n'annonce que ce
 * qui CHANGE dans le DOM. Reecrire le meme texte ("Email invalide." deux fois
 * de suite, "Reservation supprimee" deux fois de suite, le meme mot de passe
 * refuse deux fois) ne produit aucune mutation, donc aucune annonce (WCAG
 * 4.1.3) — alors qu'a l'ecran le message s'affiche normalement les deux fois.
 * On enregistre donc la suite exacte des ecritures de textContent: il doit y
 * avoir un passage par la chaine vide entre deux messages identiques.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const lire = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

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

// --- DOM factice ----------------------------------------------------------
// Seul textContent nous interesse: on journalise chaque ecriture, dans l'ordre.

function faireDom(ids) {
  const journal = [];
  const els = {};
  for (const id of ids) {
    els[id] = {
      _t: '',
      classes: new Set(),
      get textContent() { return this._t; },
      set textContent(v) { this._t = String(v); journal.push(this._t); },
      classList: {
        add: (c) => els[id].classes.add(c),
        remove: (c) => els[id].classes.delete(c),
        toggle: (c, actif) => (actif ? els[id].classes.add(c) : els[id].classes.delete(c))
      }
    };
  }
  return { journal, els, document: { getElementById: (id) => els[id] || null } };
}

// Boucle d'evenements factice. Les correctifs reposent sur "vider maintenant,
// reecrire au tick suivant": sans derouler les timers, on ne verrait rien.
function faireMinuteurs() {
  let seq = 0;
  let file = [];
  // Les delais programmes, dans l'ordre: le correctif ne tient qu'a leur valeur
  // (voir DELAI_MINIMAL), il faut donc pouvoir les inspecter.
  const delais = [];
  return {
    delais,
    setTimeout(fn, delai) {
      const h = ++seq;
      delais.push(delai || 0);
      file.push({ h, fn, delai: delai || 0, seq: h });
      return h;
    },
    clearTimeout(h) { file = file.filter((t) => t.h !== h); },
    // On deroule par tours: les timers de masquage se reprogramment, il ne
    // faut pas boucler indefiniment dessus.
    derouler(tours) {
      for (let i = 0; i < (tours || 1) && file.length; i++) {
        const lot = file.slice().sort((a, b) => a.delai - b.delai || a.seq - b.seq);
        file = [];
        lot.forEach((t) => t.fn());
      }
    }
  };
}

// Le vidage/reecriture ne suffit pas s'il tient dans une seule frame: les trois
// moteurs serialisent l'arbre d'accessibilite en fin de cycle de vie du
// document, cale sur le rendu (~16,7 ms), et fusionnent les mutations
// successives d'un meme noeud texte. Un setTimeout(..., 0) programme une tache,
// pas une frame: le vidage et la reecriture atterrissent dans la meme, bilan
// net "msg" -> "msg", aucun changement a annoncer. Il faut franchir plusieurs
// frames — le LiveAnnouncer du CDK Angular fait ce meme vidage/reecriture a
// 100 ms. Ce plancher est la seule chose qui rend tout le reste operant.
const DELAI_MINIMAL = 100;

function verifierDelai(minuteurs, quoi) {
  assert.ok(minuteurs.delais.length > 0, quoi + ': aucune reecriture programmee');
  assert.ok(minuteurs.delais[0] >= DELAI_MINIMAL,
    `${quoi}: reecriture programmee a ${minuteurs.delais[0]} ms, il en faut au moins ` +
    `${DELAI_MINIMAL} — en dessous, le vidage et la reecriture tiennent dans la meme ` +
    'frame et sont fusionnes, donc rien n\'est annonce');
}

function extraire(fichier, regex, nomFn) {
  const m = lire(fichier).match(regex);
  assert.ok(m, `${nomFn} introuvable dans ${fichier} — le test doit etre mis a jour si le code a bouge`);
  return m[0];
}

function evaluer(code, dom, minuteurs) {
  const ctx = vm.createContext({
    document: dom.document,
    setTimeout: minuteurs.setTimeout,
    clearTimeout: minuteurs.clearTimeout,
    console
  });
  new vm.Script(code).runInContext(ctx);
  return ctx;
}

// --- 1. Syntaxe du JS inline ---------------------------------------------
// Un correctif applique dans un <script> inline ne casse aucun build: la seule
// facon de voir une coquille avant la prod est de parser le fichier livre.

console.log('\n[1] Syntaxe du JavaScript inline');
for (const f of ['index.html', 'calendar/index.html', 'stats/index.html']) {
  cas('web/' + f, () => {
    const html = lire(f);
    // Uniquement les <script> qui contiennent du JS: ni src=, ni ld+json.
    const re = /<script(?![^>]*\bsrc=)((?![^>]*\btype=)|[^>]*\btype="(?:text\/javascript|module)")[^>]*>([\s\S]*?)<\/script>/g;
    const blocs = [...html.matchAll(re)];
    assert.ok(blocs.length > 0, 'aucun <script> inline trouve');
    blocs.forEach((m, i) => new vm.Script(m[2], { filename: `web/${f}#script${i}` }));
  });
}

// --- 2. Site public: showToast -------------------------------------------

console.log('\n[2] web/index.html — showToast (reservation, devis, contact)');

// La declaration du minuteur fait partie de l'extrait: showToast() annule le
// masquage en attente avant de reecrire (sans quoi le minuteur d'un toast
// precedent effacerait le message suivant en pleine vie).
const RE_SHOW_TOAST = /var toastTimer;[\s\S]*?function showToast\(msg\)\s*\{[\s\S]*?\n\}/;

cas('#toast est bien une live region', () => {
  assert.match(lire('index.html'), /id="toast"[^>]*role="status"[^>]*aria-live="polite"/);
});

cas('deux messages identiques de suite produisent deux annonces', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);

  ctx.showToast('Email invalide.');
  mt.derouler(1);
  ctx.showToast('Email invalide.');
  mt.derouler(1);

  assert.deepStrictEqual(dom.journal, ['', 'Email invalide.', '', 'Email invalide.'],
    'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('le message reste affiche apres le tick (pas de toast vide)', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);

  ctx.showToast('Demande envoyée. Réponse sous 24h.');
  mt.derouler(1);
  assert.strictEqual(dom.els.toast.textContent, 'Demande envoyée. Réponse sous 24h.');
  assert.ok(dom.els.toast.classes.has('show'), 'la classe show doit etre posee avec le texte');
});

cas('la reecriture est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);
  ctx.showToast('Corrigez les champs signalés.');
  verifierDelai(mt, 'showToast()');
});

cas('le masquage vide le texte (pas de residu au curseur virtuel)', () => {
  // Le toast ne disparait qu'en opacite/translation: sans vidage, son dernier
  // message reste lisible au curseur virtuel bien apres sa disparition visuelle.
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);
  ctx.showToast('Demande envoyée. Réponse sous 24h.');
  mt.derouler(2); // tour 1: affichage, tour 2: masquage
  assert.ok(!dom.els.toast.classes.has('show'), 'la classe show aurait du etre retiree');
  assert.strictEqual(dom.els.toast.textContent, '', 'le texte survit au masquage');
});

cas('le minuteur d\'un toast ne peut plus effacer le suivant', () => {
  // Deux toasts en moins de 4,5 s: le masquage du premier ne doit ni cacher ni
  // vider le second, encore en vie.
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);
  ctx.showToast('Sélectionnez vos dates.');
  mt.derouler(1);
  ctx.showToast('Période contenant des dates réservées.');
  mt.derouler(1); // le masquage du premier serait deroulé ici s'il subsistait
  assert.strictEqual(dom.els.toast.textContent, 'Période contenant des dates réservées.');
  assert.ok(dom.els.toast.classes.has('show'), 'le second toast a ete masque par le minuteur du premier');
});

cas('#toast absent: on n\'explose pas (garde existante)', () => {
  const dom = faireDom([]);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_SHOW_TOAST, 'showToast()'), dom, mt);
  ctx.showToast('peu importe');
  mt.derouler(1);
});

// --- 2 bis. Site public: calAnnounce (#calStatus, dans le modal) ----------
// Le toast n'est pas restitue de facon fiable tant que le dialogue aria-modal
// est ouvert: c'est #calStatus qui porte les annonces du parcours de
// reservation. Il a exactement le meme piege que showToast.

console.log('\n[2 bis] web/index.html — calAnnounce (grille et modal de réservation)');

const RE_CAL_ANNOUNCE = /var calAnnounceTimer;[\s\S]*?function calAnnounce\(msg\)\s*\{[\s\S]*?\n\}/;

cas('#calStatus est bien une live region', () => {
  assert.match(lire('index.html'), /<p[^>]*role="status"[^>]*id="calStatus"|<p[^>]*id="calStatus"[^>]*role="status"/);
});

cas('deux échecs d\'envoi identiques produisent deux annonces', () => {
  const dom = faireDom(['calStatus']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_CAL_ANNOUNCE, 'calAnnounce()'), dom, mt);

  ctx.calAnnounce('Échec de l\'envoi. Réessayez ou écrivez-nous directement.');
  mt.derouler(1);
  ctx.calAnnounce('Échec de l\'envoi. Réessayez ou écrivez-nous directement.');
  mt.derouler(1);

  assert.deepStrictEqual(dom.journal, [
    '', 'Échec de l\'envoi. Réessayez ou écrivez-nous directement.',
    '', 'Échec de l\'envoi. Réessayez ou écrivez-nous directement.'
  ], 'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('la reecriture est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['calStatus']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_CAL_ANNOUNCE, 'calAnnounce()'), dom, mt);
  ctx.calAnnounce('Date de début sélectionnée : 05/08/2026.');
  verifierDelai(mt, 'calAnnounce()');
});

cas('la purge de fermeture reste la derniere ecriture (ordre impose)', () => {
  // submitCalendarBooking() impose: clearSelection() ecrit dans #calStatus,
  // PUIS closeCalendarModal() appelle calAnnounce('') — qui doit rester la
  // derniere ecriture, sinon un message perime est relu a la reouverture.
  const dom = faireDom(['calStatus']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('index.html', RE_CAL_ANNOUNCE, 'calAnnounce()'), dom, mt);

  ctx.calAnnounce('Sélection de dates effacée.'); // clearSelection()
  ctx.calAnnounce('');                            // closeCalendarModal()
  mt.derouler(3);                                 // on laisse tout se derouler
  assert.strictEqual(dom.els.calStatus.textContent, '',
    'un message perime a survecu a la purge de fermeture');
});

// --- 3. Back-office calendrier: toast ------------------------------------

console.log('\n[3] web/calendar/index.html — toast (blocage, suppression)');

const RE_TOAST_CAL = /function toast\(msg, isErr\)\s*\{[\s\S]*?\n\}/;
const PRELUDE_CAL = 'let toastTimer;\n';

cas('#toast est bien une live region', () => {
  assert.match(lire('calendar/index.html'), /id="toast"[^>]*role="status"[^>]*aria-live="polite"/);
});

cas('deux "Réservation supprimée" de suite produisent deux annonces', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(PRELUDE_CAL + extraire('calendar/index.html', RE_TOAST_CAL, 'toast()'), dom, mt);

  ctx.toast('Réservation supprimée');
  mt.derouler(1);
  ctx.toast('Réservation supprimée');
  mt.derouler(1);

  assert.deepStrictEqual(dom.journal, ['', 'Réservation supprimée', '', 'Réservation supprimée'],
    'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('la classe error suit toujours le drapeau isErr', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(PRELUDE_CAL + extraire('calendar/index.html', RE_TOAST_CAL, 'toast()'), dom, mt);

  ctx.toast('Erreur chargement blocks: réseau', true);
  mt.derouler(1);
  assert.ok(dom.els.toast.classes.has('error'), 'classe error absente sur un message d\'erreur');
  assert.strictEqual(dom.els.toast.textContent, 'Erreur chargement blocks: réseau');

  ctx.toast('Bloqué');
  mt.derouler(1);
  assert.ok(!dom.els.toast.classes.has('error'), 'classe error non retiree sur un message normal');
  assert.strictEqual(dom.els.toast.textContent, 'Bloqué');
});

cas('la reecriture est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(PRELUDE_CAL + extraire('calendar/index.html', RE_TOAST_CAL, 'toast()'), dom, mt);
  ctx.toast('Réservation supprimée');
  verifierDelai(mt, 'toast()');
});

cas('le toast se masque bien apres son delai, et vide son texte', () => {
  const dom = faireDom(['toast']);
  const mt = faireMinuteurs();
  const ctx = evaluer(PRELUDE_CAL + extraire('calendar/index.html', RE_TOAST_CAL, 'toast()'), dom, mt);
  ctx.toast('Bloqué');
  mt.derouler(2); // tour 1: affichage, tour 2: masquage
  assert.ok(!dom.els.toast.classes.has('show'), 'la classe show aurait du etre retiree');
  // Le toast ne disparait qu'en translation: un texte laisse en place reste
  // lisible au curseur virtuel bien apres sa disparition visuelle.
  assert.strictEqual(dom.els.toast.textContent, '', 'le texte survit au masquage');
});

// --- 4. Page stats -------------------------------------------------------

console.log('\n[4] web/stats/index.html — annonces et bouton de connexion');

const RE_ANNONCER = /var minuteursAnnonce=\{\};[\s\S]*?\n  \}/;

cas('la live region #annonce existe et vit hors du conteneur [hidden]', () => {
  const html = lire('stats/index.html');
  assert.match(html, /id="annonce"[^>]*role="status"[^>]*aria-live="polite"/);
  // #board porte [hidden] au chargement: une live region a l'interieur n'est
  // pas encore active et sa premiere annonce serait perdue.
  const finDuBoard = html.indexOf('</script>', html.indexOf('id="board" hidden'));
  assert.ok(html.indexOf('id="annonce"') > finDuBoard, '#annonce doit etre place hors de #board');
});

cas('l\'erreur de connexion est une live region', () => {
  assert.match(lire('stats/index.html'), /id="erreur"[^>]*role="alert"/);
});

cas('un changement de periode annonce les chiffres et les erreurs', () => {
  const html = lire('stats/index.html');
  assert.match(html, /annoncer\('annonce','Chiffres mis à jour, sur les '\+d\.jours/,
    'afficher() doit annoncer la mise a jour des chiffres');
  assert.match(html, /annoncer\('annonce',err\.message\)/,
    'l\'echec d\'un changement de periode doit etre annonce');
});

cas('deux fois le meme message produisent deux annonces', () => {
  const dom = faireDom(['annonce']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('stats/index.html', RE_ANNONCER, 'annoncer()'), dom, mt);

  ctx.annoncer('annonce', 'Mot de passe incorrect');
  mt.derouler(1);
  ctx.annoncer('annonce', 'Mot de passe incorrect');
  mt.derouler(1);

  assert.deepStrictEqual(dom.journal, ['', 'Mot de passe incorrect', '', 'Mot de passe incorrect'],
    'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('la reecriture est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['annonce']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('stats/index.html', RE_ANNONCER, 'annoncer()'), dom, mt);
  ctx.annoncer('annonce', 'Mot de passe incorrect');
  verifierDelai(mt, 'annoncer()');
});

cas('annoncer(id, "") vide sans reprogrammer d\'ecriture', () => {
  const dom = faireDom(['erreur']);
  const mt = faireMinuteurs();
  const ctx = evaluer(extraire('stats/index.html', RE_ANNONCER, 'annoncer()'), dom, mt);

  ctx.annoncer('erreur', 'Mot de passe incorrect');
  mt.derouler(1);
  ctx.annoncer('erreur', '');
  mt.derouler(2);
  assert.strictEqual(dom.els.erreur.textContent, '', 'le message efface ne doit pas revenir');
});

cas('le bouton de connexion garde le focus pendant le chargement', () => {
  const html = lire('stats/index.html');
  // disabled ejecterait le focus vers <body> (WCAG 2.4.3).
  assert.ok(!/valider\.disabled/.test(html), 'valider.disabled subsiste dans le fichier');
  assert.match(html, /valider\.setAttribute\('aria-disabled','true'\)/);
  assert.match(html, /valider\.removeAttribute\('aria-disabled'\)/);
  // Un bouton aria-disabled reste cliquable: un garde doit bloquer le double envoi.
  assert.match(html, /if\(connexionEnCours\) return;/);
  // Et il doit rester grise a l'ecran.
  assert.match(html, /button\[aria-disabled=true\]/, 'le style disabled doit couvrir aria-disabled');
});

// --- Bilan ----------------------------------------------------------------

if (echecs) {
  console.log(`\n${echecs} verification(s) en echec.\n`);
  process.exit(1);
}
console.log('\nToutes les verifications passent.\n');
