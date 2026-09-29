/*
 * Modal « matériel de camping » de la tente de toit.
 * Lancer:  node web/materiel-modal.test.js
 *
 * Zero dependance, comme le reste du projet : on lit le HTML livre.
 *
 * Le bug couvert : le bouton « Voir le matériel inclus » appelait openMateriel(),
 * qui cherchait #materielOverlay — absent du HTML. Le clic levait une erreur
 * dans la console et n'ouvrait rien. On verifie ici que la cible existe, qu'elle
 * est un vrai dialogue, et que le compteur affiche sur le bouton correspond a la
 * liste reellement montree.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

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

// Le bloc du dialogue, de sa balise ouvrante a la fin du commentaire qui le clot.
function blocOverlay() {
  const debut = html.indexOf('id="materielOverlay"');
  assert.ok(debut > -1, '#materielOverlay absent de index.html');
  const fin = html.indexOf('<!-- /materielOverlay -->', debut);
  assert.ok(fin > -1, 'marqueur de fin <!-- /materielOverlay --> absent');
  return html.slice(html.lastIndexOf('<', debut), fin);
}

cas('le bouton de la carte tente ouvre un dialogue qui existe', () => {
  assert.ok(html.includes('onclick="openMateriel(this)"'), 'bouton sans openMateriel(this)');
  const bloc = blocOverlay();
  const ouvrante = bloc.slice(0, bloc.indexOf('>') + 1);
  assert.match(ouvrante, /role="dialog"/);
  assert.match(ouvrante, /aria-modal="true"/);
  const titre = ouvrante.match(/aria-labelledby="([^"]+)"/);
  assert.ok(titre, 'aria-labelledby manquant');
  assert.ok(bloc.includes('id="' + titre[1] + '"'), 'le titre reference est absent du dialogue');
});

cas('le dialogue a un bouton de fermeture nomme', () => {
  assert.match(blocOverlay(), /<button[^>]*type="button"[^>]*aria-label="Fermer[^"]*"[^>]*onclick="closeMateriel\(\)"/);
});

cas('le compteur du bouton = nombre d\'articles listes', () => {
  const compteur = html.match(/onclick="openMateriel\(this\)"[^]*?class="album-btn-count"[^>]*>(\d+)</);
  assert.ok(compteur, 'compteur introuvable');
  const items = blocOverlay().match(/<li class="materiel-item"/g) || [];
  assert.strictEqual(items.length, Number(compteur[1]));
});

cas('le script ouvre et ferme bien ce dialogue', () => {
  assert.match(html, /function openMateriel\(declencheur\) \{[^}]*getElementById\('materielOverlay'\)/);
  assert.match(html, /function closeMateriel\(sansRetourFocus\) \{[^}]*getElementById\('materielOverlay'\)/);
});

// Les prix affiches doivent suivre la grille TARIF (source du calcul du devis),
// pas seulement une phrase de la FAQ.
cas('les prix du dialogue suivent TARIF (tente seule, option, total)', () => {
  const tente = html.match(/tente:\s*\{[^}]*ete:(\d+)[^}]*\}/);
  assert.ok(tente, 'tarif tente introuvable dans TARIF');
  const option = html.match(/\{id:'materiel',[^}]*jour:(\d+)/);
  assert.ok(option, 'option materiel introuvable dans TARIF');
  const seule = Number(tente[1]);
  const jour = Number(option[1]);
  const bloc = blocOverlay();
  assert.match(bloc, new RegExp('>' + seule + ' €<[^]*Tente seule'));
  assert.match(bloc, new RegExp('>' + (seule + jour) + ' €<[^]*Avec le matériel'));
  assert.match(bloc, new RegExp(jour + ' € par jour en plus'));
  assert.ok(html.includes('Tente de toit</strong> : ' + seule + ' €/j toute l\'année, ' + (seule + jour) + ' €/j avec le matériel de camping'), 'la FAQ ne dit plus les memes prix');
});

if (echecs) {
  console.log('\n' + echecs + ' echec(s)');
  process.exit(1);
}
console.log('\nTous les cas passent.');
