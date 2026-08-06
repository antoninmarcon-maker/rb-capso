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

// `rang` vise la n-ieme reecriture programmee depuis le debut du cas (0 par
// defaut). Utile quand un chemin en enchaine deux — sur /app, le message
// d'attente puis la confirmation — et qu'on veut verifier la seconde.
function verifierDelai(minuteurs, quoi, rang) {
  const i = rang || 0;
  assert.ok(minuteurs.delais.length > i, quoi + ': aucune reecriture programmee');
  assert.ok(minuteurs.delais[i] >= DELAI_MINIMAL,
    `${quoi}: reecriture programmee a ${minuteurs.delais[i]} ms, il en faut au moins ` +
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
for (const f of ['index.html', 'calendar/index.html', 'stats/index.html', 'app/index.html']) {
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

// Le toast vit hors de #resaModal. Tant que le dialogue aria-modal est affiche,
// il n'est pas dans l'arbre expose aux technologies d'assistance (role="status"
// sans effet) et il est peint sous le fond de la modale (z-index 300 vs 400).
// Un echec serveur toaste sans fermer = aucun retour, ni sonore ni visuel, avec
// un bouton qui redevient « Supprimer »: l'admin conclut que c'est fait.
cas('un echec de suppression ferme la modale avant de toaster', () => {
  const src = lire('calendar/index.html');
  const fn = src.match(/async function deleteReservation\(r\)\s*\{[\s\S]*?\n\}/);
  assert.ok(fn, 'deleteReservation() introuvable — le test doit etre mis a jour');
  const branche = fn[0].match(/if \(error\) \{[\s\S]*?\n  \}/);
  assert.ok(branche, 'branche d\'echec de deleteReservation() introuvable');
  // Les commentaires parlent de la modale et du toast: on ne lit que le code.
  const code = branche[0].split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n');
  const iFermeture = code.indexOf('closeResaModal(');
  const iToast = code.indexOf('toast(');
  assert.notStrictEqual(iFermeture, -1, 'l\'echec laisse #resaModal ouvert: le toast n\'est ni entendu ni vu');
  assert.notStrictEqual(iToast, -1, 'l\'echec ne produit aucun toast');
  assert.ok(iFermeture < iToast, 'le toast est ecrit avant la fermeture de #resaModal');
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

// --- 5. Back-office /app: confirmations de sauvegarde --------------------
// Sept boutons 💾 ecrivent leur confirmation dans un <span>/<div> class="toast".
// Aucun ne passe a disabled: le double clic est possible, donc deux
// "✓ Enregistré" identiques d'affilee aussi.
//
// Precision sur le mecanisme, verifiee au navigateur: reecrire la meme chaine
// remplace bien le noeud texte (le DOM mute), mais le texte LU reste identique
// — c'est cela que le lecteur d'ecran compare, et c'est pour cela qu'il
// n'annonce rien la seconde fois. D'ou l'assertion ci-dessous: il doit y avoir
// un passage par la chaine vide entre deux messages identiques.

console.log('\n[5] web/app/index.html — confirmations de sauvegarde (boutons 💾)');

const TOASTS_APP = ['tv0', 'tv1', 'tv2', 'tv3', 'tprop', 'dtprop', 'dtpay'];
const RE_TOAST_SAUV = /var minuteursToast=\{\};[\s\S]*?\nfunction toastAttente\(id\)\{[\s\S]*?\n\}/;
// toastSauv()/toastAttente() appellent g(), qui est defini ailleurs dans la page.
const PRELUDE_APP = 'const g=id=>document.getElementById(id);\n';

function ctxApp(dom, mt) {
  return evaluer(PRELUDE_APP + extraire('app/index.html', RE_TOAST_SAUV, 'toastSauv()'), dom, mt);
}

cas('les sept confirmations sont des live regions', () => {
  const html = lire('app/index.html');
  for (const id of TOASTS_APP) {
    assert.match(html, new RegExp(`id="${id}"[^>]*role="status"[^>]*aria-live="polite"`),
      `#${id} n'est pas une live region`);
  }
});

cas('plus aucune ecriture directe de textContent sur ces conteneurs', () => {
  // Le correctif ne tient que si tout passe par toastSauv()/toastAttente().
  const html = lire('app/index.html');
  assert.ok(!/const t=g\('(?:tv'\+i|tprop|dtprop|dtpay)'\)/.test(html),
    'une sauvegarde ecrit encore directement dans son toast');
});

cas('deux "✓ Enregistré" de suite produisent deux annonces', () => {
  const dom = faireDom(['tv0']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);

  // Double clic sur 💾: deux attentes, puis deux confirmations identiques.
  ctx.toastAttente('tv0');
  ctx.toastAttente('tv0');
  ctx.toastSauv('tv0', '✓ Enregistré');
  mt.derouler(1);
  ctx.toastSauv('tv0', '✓ Enregistré');
  mt.derouler(1);

  // Les deux clics tombent avant que le "⏳" n'ait ete reecrit: son minuteur est
  // reprogramme, d'ou deux vidages d'affilee et aucune attente affichee. Ce qui
  // compte est la suite des confirmations: chacune passe par la chaine vide.
  assert.deepStrictEqual(dom.journal, [
    '', '', '',
    '✓ Enregistré',
    '', '✓ Enregistré'
  ], 'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('deux declenchements espaces annoncent chacun leur attente', () => {
  // Le defaut vise: toastAttente() ecrivait "⏳ Enregistrement…" en direct, sans
  // vidage prealable. Deux clics reecrivaient la meme chaine, donc aucune
  // mutation du texte lu et aucune annonce du second declenchement.
  const dom = faireDom(['tprop']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);

  ctx.toastAttente('tprop');
  mt.derouler(1);
  ctx.toastAttente('tprop');
  mt.derouler(1);

  assert.deepStrictEqual(dom.journal, [
    '', '⏳ Enregistrement…',
    '', '⏳ Enregistrement…'
  ], 'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('la confirmation est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['tv0']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastSauv('tv0', '✓ Enregistré');
  verifierDelai(mt, 'toastSauv() — confirmation');
});

cas('l\'echec est assez espace pour ne pas etre fusionne', () => {
  const dom = faireDom(['dtprop']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastSauv('dtprop', '✗ Échec de l\'enregistrement', true);
  verifierDelai(mt, 'toastSauv() — echec');
});

cas('l\'attente est assez espacee pour ne pas etre fusionnee', () => {
  const dom = faireDom(['dtpay']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastAttente('dtpay');
  verifierDelai(mt, 'toastAttente()');
});

cas('un echec immediat hors ligne reste annonce malgre l\'attente qui le precede', () => {
  // Le chemin qui compte. En regime nominal, toastAttente() interpose
  // "⏳ Enregistrement…" avant la requete: le texte final differe, donc
  // l'annonce passerait meme avec un delai nul. Le defaut ne se voit que
  // lorsque la promesse se resout dans la meme frame que le clic — echec
  // immediat hors ligne, ou second clic sur une reponse en cache. Ici les deux
  // ecritures se suivent sans qu'aucune frame ne les separe.
  const dom = faireDom(['tv3']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);

  ctx.toastAttente('tv3');                                  // clic
  ctx.toastSauv('tv3', '✗ Échec de l\'enregistrement', true); // rejet, meme frame
  // delais[0] = l'attente, delais[1] = la confirmation qui l'a supplantee.
  verifierDelai(mt, 'toastSauv() apres toastAttente() dans la meme frame', 1);

  mt.derouler(1);
  assert.strictEqual(dom.els.tv3.textContent, '✗ Échec de l\'enregistrement');
  assert.deepStrictEqual(dom.journal, ['', '', '✗ Échec de l\'enregistrement'],
    'suite des ecritures obtenue: ' + JSON.stringify(dom.journal));
});

cas('l\'attente vide le conteneur avant de le reecrire', () => {
  const dom = faireDom(['tprop']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastAttente('tprop');
  assert.strictEqual(dom.els.tprop.textContent, '',
    'le conteneur doit etre vide avant la reecriture differee');
  mt.derouler(1);
  assert.strictEqual(dom.els.tprop.textContent, '⏳ Enregistrement…',
    'le message d\'attente n\'a pas ete reecrit');
});

cas('l\'attente utilise son propre minuteur, pas celui de la confirmation', () => {
  // Confondre les deux rendrait toute annulation ambigue: l'effacement differe
  // d'une confirmation et l'ecriture d'une attente n'ont pas la meme duree de
  // vie et ne doivent pas se partager un handle.
  const src = lire('app/index.html');
  assert.match(src, /var minuteursAttente=\{\};/,
    'minuteursAttente introuvable — toastAttente() partage encore minuteursToast');
  const fn = src.match(/function toastAttente\(id\)\{[\s\S]*?\n\}/);
  assert.ok(fn, 'toastAttente() introuvable — le test doit etre mis a jour');
  assert.match(fn[0], /minuteursAttente\[id\]=setTimeout\(/,
    'toastAttente() ne programme pas sa reecriture sur son propre minuteur');
});

cas('l\'attente tient jusqu\'a la reponse, sans effacement differe', () => {
  const dom = faireDom(['dtpay']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastAttente('dtpay');
  mt.derouler(3); // une requete lente: on laisse filer le temps
  assert.strictEqual(dom.els.dtpay.textContent, '⏳ Enregistrement…',
    'l\'attente a ete effacee alors que la requete n\'a pas repondu');
});

cas('un echec est signale autrement que par la couleur de reussite', () => {
  const dom = faireDom(['dtprop']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);

  ctx.toastSauv('dtprop', '✗ Échec de l\'enregistrement', true);
  mt.derouler(1);
  assert.ok(dom.els.dtprop.classes.has('err'), 'classe err absente sur un echec');
  ctx.toastSauv('dtprop', '✓ Mémorisé');
  mt.derouler(1);
  assert.ok(!dom.els.dtprop.classes.has('err'), 'classe err non retiree sur une reussite');
});

cas('la confirmation s\'efface apres son delai', () => {
  const dom = faireDom(['tv1']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastSauv('tv1', '✓ Enregistré');
  mt.derouler(2); // tour 1: ecriture, tour 2: effacement
  assert.strictEqual(dom.els.tv1.textContent, '', 'la confirmation aurait du s\'effacer');
});

cas('un effacement arme par une sauvegarde anterieure ne balaie pas la suivante', () => {
  // Deux clics a moins de 2,5 s d'intervalle: avant, le minuteur du premier
  // vidait le message du second en pleine lecture.
  const dom = faireDom(['tv2']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);

  ctx.toastSauv('tv2', '✓ Enregistré');
  mt.derouler(1);              // le message est ecrit, son effacement est arme
  ctx.toastSauv('tv2', '✓ Enregistré'); // deuxieme clic avant les 2,5 s
  mt.derouler(1);
  assert.strictEqual(dom.els.tv2.textContent, '✓ Enregistré',
    'le message du second clic a ete efface par le minuteur du premier');
});

cas('toastSauv(id, "") vide sans reprogrammer d\'ecriture', () => {
  const dom = faireDom(['tprop']);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastSauv('tprop', '✓ Mémorisé');
  mt.derouler(1);
  ctx.toastSauv('tprop', '');
  mt.derouler(2);
  assert.strictEqual(dom.els.tprop.textContent, '', 'le message efface ne doit pas revenir');
});

cas('conteneur absent: on n\'explose pas', () => {
  const dom = faireDom([]);
  const mt = faireMinuteurs();
  const ctx = ctxApp(dom, mt);
  ctx.toastAttente('tv0');
  ctx.toastSauv('tv0', '✓ Enregistré');
  mt.derouler(1);
});

cas('les boutons 💾 ne passent pas a disabled pendant la sauvegarde', () => {
  // Un bouton passe a disabled perd le focus, qui retombe sur <body>
  // (WCAG 2.4.3) — le defaut corrige sur la page stats dans #14. Ces
  // quatre-la n'y touchent pas: ce test verrouille cet etat.
  const html = lire('app/index.html');
  const RE_SAVES = /(async function (?:saveVeh|saveProp|dSaveProp|dSavePay)\([^)]*\)\{[\s\S]*?\n\})/g;
  const corps = [...html.matchAll(RE_SAVES)].map((m) => m[1]);
  assert.strictEqual(corps.length, 4, 'les quatre fonctions de sauvegarde doivent etre trouvees');
  for (const c of corps) {
    assert.ok(!/\.disabled\s*=/.test(c),
      'une fonction de sauvegarde passe son bouton a disabled:\n' + c);
  }
});

// --- Bilan ----------------------------------------------------------------

if (echecs) {
  console.log(`\n${echecs} verification(s) en echec.\n`);
  process.exit(1);
}
console.log('\nToutes les verifications passent.\n');
