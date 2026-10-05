/*
 * Confidentialite du calendrier public : aucun prenom de client expose ni affiche.
 * Lancer:  node web/calendrier-confidentialite.test.js
 * Verification par lecture des sources livrees.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const lire = (p) => fs.readFileSync(path.join(__dirname, p), 'utf8');

// 1. La migration 015 recree la vue sans prenom.
const mig = lire('../supabase/migrations/015_calendrier_sans_nom.sql')
  .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
assert(/drop view if exists reservations_public/i.test(mig), 'drop view manquant');
const m = mig.match(/create view reservations_public as\s+select([\s\S]*?)from\s+reservations/i);
assert(m, 'create view reservations_public introuvable');
assert(!/prenom/i.test(m[1]), 'la vue expose encore prenom');
for (const c of ['id', 'vehicle', 'start_date', 'end_date', 'status', 'forfait']) {
  assert(new RegExp('\\b' + c + '\\b').test(m[1]), 'colonne manquante : ' + c);
}
assert(/grant select on reservations_public to anon, authenticated/i.test(mig), 'grant manquant');

// 2. Le pont ne lit plus le prenom.
const bridge = lire('booking-bridge.js');
assert(!/r\.prenom/.test(bridge), 'booking-bridge lit encore r.prenom');
assert(!/Indispo|Reserve'/.test(bridge), 'libelle affichable dans booking-bridge');

// 3. Le calendrier n'affiche plus de libelle personnel.
const html = lire('index.html');
assert(!html.includes('getBookingLabel'), 'getBookingLabel encore present');
assert(!/class="day-label"/.test(html), 'day-label encore rendu');

console.log('calendrier-confidentialite : OK');
