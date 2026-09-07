# Refonte RB-CapSO — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer les neuf demandes de Romain (site + application) en cinq PR, dans l'ordre migration → Edge Function → frontend, sans jamais casser la signature en prod.

**Architecture:** Deux fichiers HTML monolithiques (`web/index.html`, `web/app/index.html`) + Supabase (migrations SQL idempotentes, RPC `security definer`) + Edge Functions Deno. Un bloc de tarif dupliqué à l'identique dans les deux HTML, verrouillé par un test node qui extrait le code livré.

**Tech Stack:** HTML/CSS/JS vanilla (zéro dépendance), Supabase (Postgres 15, Storage, pg_cron), Deno Edge Functions, Resend, Stripe Payment Links, jsPDF (déjà chargé), node 22 pour les tests.

**Spec:** `docs/superpowers/specs/2026-09-06-refonte-site-app-design.md`

## Global Constraints

> **Révision du 07/09/2026** (réponses de Romain) : les 70 € de frais de service ne
> figurent que sur le contrat — `calculerEstimation` reçoit `sans_frais:true` côté site
> et demande ; le règlement se fait en totalité à la signature du contrat — plus
> d'acompte 30 % ni de solde, le lot 5 génère un seul lien de paiement. Les tâches
> ci-dessous qui mentionnent l'acompte ou « site + contrat » se lisent avec cette révision.

- Zéro dépendance ajoutée au dépôt (CI : les tests sont des `node web/**/*.test.js` autonomes).
- Jamais de `sed`/`perl` sur ces fichiers (accents) : éditions par outil Edit ou script node.
- Montants en centimes entiers dans la base et dans les calculs (`Math.round(x*100)`).
- Ordre d'application obligatoire par PR : migration SQL → Edge Function → merge frontend.
- Un sujet = un worktree `~/Documents/worktrees/rb-capso/<slug>` = une PR draft (`ship push`), tier SOLIDE : aucun merge sans OK d'Antonin.
- Toute modification de la FAQ touche le `<details>` **et** le JSON-LD `FAQPage` de `web/index.html`.
- `.github/a11y-baseline.json` ne reçoit jamais de nouvelle entrée.
- Textes en français, sans anglicisme d'interface ; libellés de prix au format `530 €` / `47,50 €`.

---

## PR 1 — `feat/site-vitrine`

### Task 1 : Logo image dans le bandeau

**Files:**
- Modify: `web/index.html:235-236` (CSS `.nav-logo`), `web/index.html:731` (media 480px), `web/index.html:853` (markup nav)

**Interfaces:**
- Produces: `.nav-logo img` (52 px desktop / 44 px mobile), texte « RB-CapSO » conservé.

- [ ] **Step 1 : CSS.** Remplacer la règle `.nav-logo{…}` par :

```css
.nav-logo{font-family:'Playfair Display',serif;font-size:22px;color:var(--text);text-decoration:none;display:inline-flex;align-items:center;gap:10px}
.nav-logo img{height:52px;width:52px;object-fit:contain;display:block}
.nav-logo span{color:var(--ocean)}
```

et dans `@media (max-width: 480px)` : `nav .nav-logo { font-size: 18px; gap:8px; } nav .nav-logo img { height:44px; width:44px; }`.

- [ ] **Step 2 : markup.** Remplacer `<a href="#" class="nav-logo">RB<span>-CapSO</span></a>` par :

```html
<a href="#" class="nav-logo"><img src="/assets/photo-01-5fb49c7f.png" alt="" width="52" height="52" decoding="async">RB<span>-CapSO</span></a>
```

- [ ] **Step 3 : vérifier** — servir `web/` (`python3 -m http.server 8080 --directory web`), ouvrir `/`, contrôler la hauteur du bandeau (70 px, inchangée) et l'absence de débordement à 375 px.
- [ ] **Step 4 : commit** `feat(site): logo image dans le bandeau`.

### Task 2 : Instagram dans le bandeau, le menu mobile et le footer

**Files:** Modify `web/index.html:854-872` (nav + mobile menu), `web/index.html:1317-1319` (footer col 1), CSS `.nav-links` (ligne 237).

- [ ] **Step 1 : nav.** Avant `<li><a href="#contact" class="nav-cta">Contact</a></li>` insérer :

```html
<li><a href="https://www.instagram.com/rb.capso/" class="nav-insta" target="_blank" rel="noopener" aria-label="Instagram (nouvelle fenêtre)"><svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg></a></li>
```

CSS : `.nav-insta{display:inline-flex;align-items:center;padding:6px;border-radius:50%}.nav-insta:hover{color:var(--ocean)}`.

- [ ] **Step 2 : menu mobile.** Après le lien « Disponibilités » : `<a href="https://www.instagram.com/rb.capso/" target="_blank" rel="noopener" onclick="closeMobileMenu()">Instagram</a>`.
- [ ] **Step 3 : footer.** Après `<p class="footer-desc">…</p>` : `<p class="footer-desc"><a href="https://www.instagram.com/rb.capso/" target="_blank" rel="noopener" style="color:var(--ocean-light);text-decoration:none">Suivez-nous sur Instagram · @rb.capso</a></p>`.
- [ ] **Step 4 : vérifier** au clavier (Tab atteint l'icône, nom annoncé « Instagram (nouvelle fenêtre) »). Commit `feat(site): lien Instagram dans le bandeau, le menu mobile et le footer`.

### Task 3 : Terrain clos (FAQ HTML + JSON-LD + CGV §6d)

**Files:** Modify `web/index.html:191` (JSON-LD), `:970` (FAQ), CGV §6d (~`:2510`).

- [ ] **Step 1.** JSON-LD : `"text": "La remise des véhicules se fait au 9 rue du Hapchot, 40130 Capbreton. Une remise à la gare de Saint-Vincent-de-Tyrosse est également possible sur demande. Votre véhicule peut être stationné dans un terrain clos pendant toute la durée de la location."`
- [ ] **Step 2.** FAQ : ajouter ` Votre véhicule peut être stationné dans un <strong>terrain clos</strong> pendant toute la durée de la location.` à la fin du `<p>`.
- [ ] **Step 3.** CGV §6d : même phrase à la fin du paragraphe.
- [ ] **Step 4.** Vérifier `node -e "JSON.parse(require('fs').readFileSync('web/index.html','utf8').match(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)…"` — le bloc FAQPage reste un JSON valide (script : extraire chaque `<script type="application/ld+json">` et `JSON.parse`). Commit `feat(site): mention du stationnement en terrain clos`.

### Task 4 : CGV et FAQ — annulation, frais de service, options, acompte

**Files:** Modify `web/index.html` : JSON-LD (annulation `:209`, matériel `:215`), FAQ (`:974`, `:977`), CGV §2 (`:2492`), §3 (`:2494`), §5 (`:2500-2504`).

- [ ] **Step 1 : annulation, 4 endroits** (JSON-LD, FAQ, CGV §5 liste) : « Plus de 30 jours avant le départ : remboursement intégral. De 15 à 30 jours inclus : 50 % remboursé. De 7 à 14 jours : 25 % remboursé. Moins de 7 jours : aucun remboursement. Les frais de service (70 €) ne sont pas remboursables. »
- [ ] **Step 2 : CGV §3** ajouter le paragraphe : `<p>Des frais de service de <strong>70 € par location</strong> s'ajoutent au prix de la location ; ils sont inclus dans l'estimation affichée sur le site. Options : planche de surf, stand-up paddle, canoë-kayak <strong>10 €/jour</strong> chacun ; kit linge de lit <strong>25 € par location</strong>. TVA non applicable, art. 293 B du CGI.</p>`
- [ ] **Step 3 : CGV §2** ajouter : `<p>Un acompte de <strong>30 %</strong> du montant total est versé à la signature du contrat ; le solde est réglé au plus tard le jour du départ.</p>`
- [ ] **Step 4 : matériel** (FAQ + JSON-LD) : ajouter « Kit linge de lit : 25 € par location. »
- [ ] **Step 5.** Re-vérifier le JSON-LD, commit `feat(site): CGV et FAQ — frontière d'annulation, frais de service, options, acompte`.

### Task 5 : Docs + PR

- [ ] `ship push -m "docs: spec et plan de la refonte site + application"` (les docs `docs/superpowers/**` sont dans cette PR).
- [ ] Revue accessibilité du diff (agent `accessibility-lead`, modèle haiku), corriger, `ship ready`, s'arrêter (tier SOLIDE).

---

## PR 2 — `feat/estimation-options`

### Task 6 : Migration 009

**Files:** Create `supabase/migrations/009_options_estimation.sql`

- [ ] **Step 1 : écrire**

```sql
-- Options (surf, paddle, kayak, linge) et estimation vue par le client.
-- Le forfait km existait deja (004). On ajoute :
--   - reservations.options         : tableau JSON d'ids d'options cochees
--   - reservations.estimation_cents: le total estime affiche au client (centimes)
--   - submit_booking a 11 arguments (tous requis : aucune ambiguite avec l'ancienne)
--   - l'ancienne signature a 9 arguments est CONSERVEE comme relais, pour que le
--     frontend en prod (encore sur 9 args) continue de marcher entre l'application
--     de la migration et le deploiement Vercel.

alter table reservations add column if not exists options jsonb not null default '[]'::jsonb;
alter table reservations add column if not exists estimation_cents integer;
alter table reservations drop constraint if exists reservations_estimation_positive;
alter table reservations add constraint reservations_estimation_positive
  check (estimation_cents is null or estimation_cents >= 0);
alter table reservations drop constraint if exists reservations_options_array;
alter table reservations add constraint reservations_options_array
  check (jsonb_typeof(options) = 'array');

create or replace function submit_booking(
  p_vehicle text, p_prenom text, p_nom text, p_tel text, p_email text,
  p_start date, p_end date, p_notes text, p_forfait text,
  p_options jsonb, p_estimation_cents integer
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid;
  v_opt text;
begin
  if p_vehicle not in ('penelop','peggy','pamela','tente') then
    raise exception 'Invalid vehicle: %', p_vehicle;
  end if;
  if p_end <= p_start then
    raise exception 'end_date must be after start_date';
  end if;
  if p_options is null or jsonb_typeof(p_options) <> 'array' then
    raise exception 'options must be a JSON array';
  end if;
  for v_opt in select jsonb_array_elements_text(p_options) loop
    if v_opt not in ('surf','paddle','kayak','linge') then
      raise exception 'Invalid option: %', v_opt;
    end if;
  end loop;
  if p_estimation_cents is not null and p_estimation_cents < 0 then
    raise exception 'estimation_cents must be >= 0';
  end if;
  if exists (
    select 1 from reservations
    where vehicle = p_vehicle and status in ('option','confirmee','completee')
      and daterange(start_date, end_date, '[)') && daterange(p_start, p_end, '[)')
  ) then
    raise exception 'Dates indisponibles : chevauchement avec une reservation deja confirmee' using errcode = 'DATES';
  end if;
  if exists (
    select 1 from availability_blocks
    where vehicle = p_vehicle
      and daterange(start_date, end_date, '[)') && daterange(p_start, p_end, '[)')
  ) then
    raise exception 'Dates indisponibles : blocage admin sur ce vehicule' using errcode = 'DATES';
  end if;
  insert into reservations (vehicle, prenom, nom, tel, email, start_date, end_date, status, notes, forfait, options, estimation_cents)
  values (p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, 'pending', p_notes, p_forfait, p_options, p_estimation_cents)
  returning id into v_id;
  return v_id;
end;
$$;

-- Relais : ancienne signature (site en prod avant deploiement du nouveau frontend).
create or replace function submit_booking(
  p_vehicle text, p_prenom text, p_nom text, p_tel text, p_email text,
  p_start date, p_end date, p_notes text default null, p_forfait text default null
) returns uuid
language sql security definer set search_path = public
as $$
  select submit_booking(p_vehicle, p_prenom, p_nom, p_tel, p_email, p_start, p_end, p_notes, p_forfait, '[]'::jsonb, null::integer);
$$;

grant execute on function submit_booking(text,text,text,text,text,date,date,text,text,jsonb,integer) to anon, authenticated;
grant execute on function submit_booking(text,text,text,text,text,date,date,text,text) to anon, authenticated;
```

- [ ] **Step 2 : tester** sur Supabase local (copie des migrations, `supabase db reset`), puis en SQL : appel 9 args → ligne créée avec `options='[]'` ; appel 11 args avec `'["surf","linge"]'`, 53000 → ligne créée ; appel avec `'["jetski"]'` → exception `Invalid option`. Commit `feat(db): options et estimation sur les demandes (migration 009)`.

### Task 7 : Bloc tarif partagé + test

**Files:** Modify `web/index.html` (avant `const VEHICLE_NAMES`, ~`:1365`), `web/app/index.html:1593` (`const FORFS`), Create `web/pricing.test.js`.

**Interfaces:**
- Produces: `TARIF`, `calculerEstimation({jours, prix_jour, forfait, options, sans_km}) → {lignes:[{id,l,cents}], total_cents}`, `fmtEuros(cents)`.

- [ ] **Step 1 : test d'abord** — `web/pricing.test.js` :

```js
/*
 * Tarif partage site <-> /app. Lancer : node web/pricing.test.js
 * Le bloc entre les marqueurs "TARIF PARTAGE (debut)" / "(fin)" doit etre
 * identique dans web/index.html et web/app/index.html : c'est ce qui empeche
 * les deux formules de diverger (la tente a deja ete affichee 40-60 EUR/j
 * alors que le code calculait 50).
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lire = p => fs.readFileSync(path.join(__dirname, p), 'utf8');
function bloc(src, nom) {
  const m = src.match(/\/\/ ═══ TARIF PARTAGÉ \(début\) ═══([\s\S]*?)\/\/ ═══ TARIF PARTAGÉ \(fin\) ═══/);
  assert(m, 'bloc TARIF PARTAGÉ introuvable dans ' + nom);
  return m[1];
}
const site = bloc(lire('index.html'), 'web/index.html');
const app = bloc(lire('app/index.html'), 'web/app/index.html');
let echecs = 0;
function cas(nom, fn) { try { fn(); console.log('  ok     ' + nom); } catch (e) { echecs++; console.log('  ECHEC  ' + nom + '\n         ' + e.message); } }
cas('les deux blocs sont identiques', () => assert.strictEqual(site, app));
const ctx = {}; vm.createContext(ctx); vm.runInContext(site + '\nthis.TARIF=TARIF;this.calculerEstimation=calculerEstimation;this.fmtEuros=fmtEuros;', ctx);
const { calculerEstimation, fmtEuros } = ctx;
cas('3 jours Penelope, 200 km/j, surf + linge = 530 EUR', () => {
  const r = calculerEstimation({ jours: 3, prix_jour: 120, forfait: '200 km/jour', options: ['surf', 'linge'], sans_km: false });
  assert.deepStrictEqual(r.lignes.map(l => [l.id, l.cents]), [['location', 36000], ['forfait', 4500], ['surf', 3000], ['linge', 2500], ['service', 7000]]);
  assert.strictEqual(r.total_cents, 53000);
});
cas('tente : le forfait km est ignore', () => {
  const r = calculerEstimation({ jours: 2, prix_jour: 50, forfait: 'Illimité', options: [], sans_km: true });
  assert.deepStrictEqual(r.lignes.map(l => l.id), ['location', 'service']);
  assert.strictEqual(r.total_cents, 17000);
});
cas('demi-journee cote /app : arrondi au centime', () => {
  const r = calculerEstimation({ jours: 2.5, prix_jour: 95, forfait: null, options: ['paddle'], sans_km: false });
  assert.strictEqual(r.total_cents, Math.round(2.5 * 95 * 100) + 2500 + 7000);
});
cas('option inconnue ignoree', () => {
  const r = calculerEstimation({ jours: 1, prix_jour: 100, forfait: null, options: ['jetski'], sans_km: false });
  assert.strictEqual(r.total_cents, 17000);
});
cas('fmtEuros', () => { assert.strictEqual(fmtEuros(53000), '530 €'); assert.strictEqual(fmtEuros(4750), '47,50 €'); assert.strictEqual(fmtEuros(0), '0 €'); });
if (echecs) { console.log('\n' + echecs + ' echec(s)'); process.exit(1); }
console.log('\npricing: tout passe');
```

- [ ] **Step 2 : lancer** `node web/pricing.test.js` → ECHEC « bloc introuvable ».
- [ ] **Step 3 : écrire le bloc**, identique dans les deux fichiers :

```js
// ═══ TARIF PARTAGÉ (début) ═══
// Copie IDENTIQUE dans web/index.html et web/app/index.html.
// web/pricing.test.js extrait ce bloc des deux fichiers et échoue s'ils diffèrent.
const TARIF = {
  forfaits: [{l:'100 km/jour',k:100,e:0},{l:'200 km/jour',k:200,e:15},{l:'Illimité',k:null,e:25}],
  options: [
    {id:'surf',   l:'Planche de surf',  jour:10},
    {id:'paddle', l:'Stand-up paddle',  jour:10},
    {id:'kayak',  l:'Canoë-kayak',      jour:10},
    {id:'linge',  l:'Kit linge de lit', fixe:25}
  ],
  frais_service: 70,
  km_sup: 0.30
};
// Montants en centimes entiers. jours peut valoir 0,5 côté /app.
function calculerEstimation(p) {
  const j = Number(p.jours) || 0, pj = Number(p.prix_jour) || 0;
  const c = function (x) { return Math.round(x * 100); };
  const lignes = [{id:'location', l: j + ' jour' + (j > 1 ? 's' : '') + ' × ' + pj + ' €', cents: c(j * pj)}];
  if (!p.sans_km && p.forfait) {
    const f = TARIF.forfaits.find(function (x) { return x.l === p.forfait; });
    if (f && f.e) lignes.push({id:'forfait', l:'Forfait ' + f.l, cents: c(j * f.e)});
  }
  (p.options || []).forEach(function (id) {
    const o = TARIF.options.find(function (x) { return x.id === id; });
    if (o) lignes.push({id:o.id, l:o.l, cents: o.fixe ? c(o.fixe) : c(j * o.jour)});
  });
  lignes.push({id:'service', l:'Frais de service', cents: c(TARIF.frais_service)});
  return {lignes: lignes, total_cents: lignes.reduce(function (s, x) { return s + x.cents; }, 0)};
}
function fmtEuros(cents) {
  const e = Math.floor(cents / 100), r = cents % 100;
  return (r ? e + ',' + String(r).padStart(2, '0') : String(e)) + ' €';
}
// ═══ TARIF PARTAGÉ (fin) ═══
```

Dans `/app`, remplacer `const FORFS=[…]` par `const FORFS=TARIF.forfaits;` juste après le bloc.

- [ ] **Step 4 : lancer** les 4 tests node → verts. Commit `feat(tarif): bloc de tarif partagé site/app verrouillé par test`.

### Task 8 : Site — estimation visible, options, forfait masqué pour la tente

**Files:** Modify `web/index.html` : CSS (`:779-793`), markup étape 1/2 (`:1252-1296`), JS `updateBookingBar` (`:1652`), `showBookingForm` (`:1691`), `submitCalendarBooking` (`:1743-1830`), `selectVehicle` (`:1399`).

- [ ] **Step 1 : markup étape 2**, après le `</fieldset>` forfait :

```html
<fieldset class="options-fieldset" style="margin-bottom:12px;">
  <legend style="display:block;font-size:12px;color:var(--text-muted);margin-bottom:6px;">Options</legend>
  <div class="options-grid">
    <label class="option-item"><input type="checkbox" name="bookOption" value="surf">Planche de surf <span>10 €/jour</span></label>
    <label class="option-item"><input type="checkbox" name="bookOption" value="paddle">Stand-up paddle <span>10 €/jour</span></label>
    <label class="option-item"><input type="checkbox" name="bookOption" value="kayak">Canoë-kayak <span>10 €/jour</span></label>
    <label class="option-item"><input type="checkbox" name="bookOption" value="linge">Kit linge de lit <span>25 €</span></label>
  </div>
</fieldset>
<div class="estimate-box" id="bookEstimate" role="status" aria-live="polite"></div>
```

CSS : `.options-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.option-item{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--sand-dark);border-radius:8px;font-size:13px;cursor:pointer}.option-item span{margin-left:auto;color:var(--text-muted);font-size:12px}.option-item:has(input:checked){border-color:var(--ocean);background:var(--ocean-pale)}.estimate-box{background:var(--fog);border-radius:10px;padding:10px 14px;margin-bottom:12px;font-size:13px}.estimate-box .est-row{display:flex;justify-content:space-between;gap:1rem}.estimate-box .est-total{display:flex;justify-content:space-between;font-size:18px;font-weight:500;border-top:1px solid var(--sand-dark);margin-top:6px;padding-top:6px}.estimate-box .est-note{font-size:11px;color:var(--text-muted);margin-top:4px}`.
Étape 1 : `.booking-info strong` reste ; ajouter `<span class="booking-total" id="bookingTotal" style="display:block;font-size:18px;font-weight:500;"></span>`.

- [ ] **Step 2 : JS.** Fonctions :

```js
function getSelectedOptions(){return Array.from(document.querySelectorAll('input[name=bookOption]:checked')).map(function(i){return i.value;});}
function estimationCourante(){
  const jours = diffDays(selStart, selEnd) + 1;
  return calculerEstimation({jours: jours, prix_jour: VEHICLE_PRICES[currentVehicle], forfait: getSelectedForfait(), options: getSelectedOptions(), sans_km: currentVehicle === 'tente'});
}
function renderEstimate(){
  const box = document.getElementById('bookEstimate'); if (!box || !selStart || !selEnd) return;
  const e = estimationCourante();
  box.replaceChildren();
  e.lignes.forEach(function(l){ const r=document.createElement('div'); r.className='est-row'; const a=document.createElement('span'); a.textContent=l.l; const b=document.createElement('span'); b.textContent=fmtEuros(l.cents); r.append(a,b); box.appendChild(r); });
  const t=document.createElement('div'); t.className='est-total'; const ta=document.createElement('span'); ta.textContent='Total estimé'; const tb=document.createElement('span'); tb.textContent=fmtEuros(e.total_cents); t.append(ta,tb); box.appendChild(t);
  const n=document.createElement('div'); n.className='est-note'; n.textContent='Frais de service inclus. Caution de ' + (currentVehicle==='tente'?'500':'2 000') + ' € par chèque, non incluse. Estimation, confirmée par le contrat.'; box.appendChild(n);
  const tot=document.getElementById('bookingTotal'); if(tot) tot.textContent='Total estimé : ' + fmtEuros(e.total_cents);
}
```

`updateBookingBar` et `showBookingForm` : remplacer `jours * VEHICLE_PRICES[…]` par `fmtEuros(estimationCourante().total_cents)` et appeler `renderEstimate()`. Écouteurs : `document.querySelectorAll('input[name=bookForfait],input[name=bookOption]').forEach(i=>i.addEventListener('change',renderEstimate))`. `selectVehicle` : `document.querySelector('.forfait-fieldset').hidden = (id==='tente'); if(id==='tente') clearForfaitSelection(); renderEstimate();`.

- [ ] **Step 3 : envoi.** `submitCalendarBooking` : `const options = getSelectedOptions(); const est = estimationCourante();` → `sb.rpc('submit_booking', {…, p_options: options, p_estimation_cents: est.total_cents})` ; dataLayer `options: options.join(',')||'aucune', estimation: est.total_cents/100` ; email web3forms : lignes `Options : …` et `Estimation vue par le client : … €`. Réinitialiser les cases après envoi.
- [ ] **Step 4 : vérifier** — tests node verts ; navigateur : sélectionner Pénélope 3 jours, cocher 200 km + surf + linge → « Total estimé : 530 € » ; passer sur tente → forfait masqué, total recalculé ; clavier : Tab parcourt les cases. Commit `feat(site): estimation détaillée, options et forfait réactifs`.

### Task 9 : /app — demande, carte demande, préremplissage, contrat

**Files:** Modify `web/app/index.html` : formulaire demande (`:1042-1048`), `submitDemande` (`:2566`), `renderDemandeCard` (`:2678`), `prefillContratFromDemande` (`:2735`), étape Location du contrat (`:575-579`, forfaits `:604-612`), `calcTot` (`:1729`), `collectC` (`:1937`), `buildRecap_c` (`:1753`), `genPDF_c` (`:1769`), `downloadContractPDF` (`:1451`).

- [ ] **Step 1 : demande.** Sous les cartes forfait, mêmes 4 cases (`name="demOption"`) + `<div id="dem_estimate" role="status" aria-live="polite">`. `submitDemande` envoie `p_options` et `p_estimation_cents` (prix/jour : `{penelop:120,peggy:95,pamela:95,tente:50}` local `VEH_PRIX`) ; masquer les forfaits si `demSlug==='tente'`.
- [ ] **Step 2 : carte demande.** Afficher `d.options` (libellés via `TARIF.options`) et `fmtEuros(d.estimation_cents)` quand présents. `prefillContratFromDemande` : cocher les options du contrat (`d.options`).
- [ ] **Step 3 : contrat.** Étape Location : 4 cases `name="cOption"` sous les forfaits ; `calcTot` : `const e=calculerEstimation({jours:du.tu,prix_jour:pj,forfait:forfait>=0?FORFS[forfait].l:null,options:getCOptions(),sans_km:selVehIdx===3}); stot = (e.total_cents - 7000)/100 ; total = max(0, e.total_cents/100 - red)` ; champs `lfrais` (readonly 70) ajouté à côté de la réduction. `collectC` ajoute `options`, `frais_service:70`, `lignes:e.lignes`. Récap + PDF : lignes d'options et « Frais de service ». `selVeh(3)` masque les forfaits.
- [ ] **Step 4 : vérifier** tests node, commit `feat(app): options et frais de service dans les demandes et le contrat`, `ship push`, revue a11y, `ship ready`.

---

## PR 3 — `feat/documents-signables`

### Task 10 : Migration 010

**Files:** Create `supabase/migrations/010_documents_signables.sql`

- [ ] **Step 1 : écrire**

```sql
-- Trois documents signables : contrat, etat des lieux de depart, retour.
--   - type 'edl_depart'
--   - parent_id : lien EDL/retour -> contrat (ref_code reste ecrit dans le payload)
--   - projection token elargie (signatures pour le PDF locataire, tarif, EDL, CGV)
--   - acceptation des conditions d'annulation exigee cote serveur pour un contrat

alter table contracts drop constraint if exists contracts_type_check;
alter table contracts add constraint contracts_type_check
  check (type in ('presentiel','retour','distance','edl_depart'));
alter table contracts add column if not exists parent_id uuid references contracts(id) on delete set null;
create index if not exists idx_contracts_parent on contracts (parent_id);

create or replace function fetch_contract_by_token(p_token text)
returns jsonb
language plpgsql security definer set search_path = public
stable
as $$
declare
  c contracts%rowtype;
  p jsonb;
begin
  if p_token is null or length(p_token) < 24 then return null; end if;
  select * into c from contracts where access_token = p_token limit 1;
  if c.id is null then return null; end if;
  p := coalesce(c.payload, '{}'::jsonb);
  return jsonb_build_object(
    'id', c.id, 'code', c.code, 'type', c.type, 'vehicle', c.vehicle, 'status', c.status,
    'parent_id', c.parent_id,
    'signature_loc', c.signature_loc, 'signature_loc_date', c.signature_loc_date,
    'created_at', c.created_at,
    'payload', (
      select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
      from jsonb_each(p)
      where key in (
        'v_nom','v_marque','v_annee','v_immat',
        -- Proprietaire : coordonnees professionnelles publiques (site). p_ass reste exclu.
        'p_pre','p_nom','p_adr','p_tel','p_mail',
        'debut','debut_h','fin','fin_h','duree','lieu','km',
        'pj','stot','red','total','caution','forfait','forfait_extra',
        'options','frais_service','lignes','acompte','solde','tva_mention',
        'iban','banque','iban_tit',
        'l_nom','l_pre','l_adr','l_tel','l_mail','l_naiss','l_naiss_l','l_perm','l_perm_d',
        's2nom','s2pre','s2tel','s2perm','s2naiss','s2perm_d','s2',
        'paiements',
        -- Signature proprietaire : image ET date (PDF locataire complet, decision 06/09/2026)
        'sig_prop','sig_prop_date','slieu',
        'cgv_accept','cgv_accept_date',
        -- Etat des lieux (depart et retour)
        'ref_code','equipements','km_dep','km_ret','km_par','carbu','eau','etat','prop','prop_ret','carro','bat','obs',
        'vid_ext','vid_int','vid_note','photos'
      )
    )
  );
end;
$$;

create or replace function submit_contract_by_token(
  p_token text, p_locataire_patch jsonb, p_paiements text[], p_sig text, p_sig_date text
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_id uuid; v_type text; v_payload jsonb; v_patch jsonb;
begin
  if p_token is null or length(p_token) < 24 then raise exception 'token invalide'; end if;
  if p_sig is null or length(p_sig) < 50 then raise exception 'signature requise'; end if;
  select id, type, payload into v_id, v_type, v_payload
  from contracts where access_token = p_token and status = 'pending' limit 1;
  if v_id is null then raise exception 'contrat introuvable ou deja signe'; end if;
  v_patch := (
    select coalesce(jsonb_object_agg(key, value), '{}'::jsonb)
    from jsonb_each(coalesce(p_locataire_patch, '{}'::jsonb))
    where key in (
      'l_nom','l_pre','l_adr','l_tel','l_mail','l_naiss','l_naiss_l','l_perm','l_perm_d',
      'debut','debut_h','fin','fin_h','lieu',
      's2nom','s2pre','s2tel','s2perm','s2naiss','s2perm_d','s2',
      'cgv_accept'
    )
  );
  -- Un contrat ne se signe pas sans acceptation explicite des conditions d'annulation.
  if v_type in ('presentiel','distance') then
    if coalesce(v_patch->>'cgv_accept','') <> 'true' then
      raise exception 'acceptation des conditions d''annulation requise';
    end if;
    v_patch := v_patch || jsonb_build_object('cgv_accept', true, 'cgv_accept_date', to_char(now() at time zone 'Europe/Paris', 'DD/MM/YYYY HH24:MI'));
  else
    v_patch := v_patch - 'cgv_accept';
  end if;
  v_payload := coalesce(v_payload, '{}'::jsonb) || v_patch;
  if p_paiements is not null and array_length(p_paiements, 1) > 0 then
    v_payload := jsonb_set(v_payload, '{paiements}', to_jsonb(p_paiements));
  end if;
  update contracts set payload = v_payload, signature_loc = p_sig, signature_loc_date = p_sig_date, status = 'signed'
  where id = v_id;
  return v_id;
end;
$$;
```

- [ ] **Step 2 : tester** en local : insérer un contrat `presentiel` pending ; `submit_contract_by_token(token,'{}',…)` → exception « acceptation … requise » ; avec `'{"cgv_accept":true,"total":"1"}'` → signé, `cgv_accept_date` présent, `total` **inchangé** (liste blanche) ; un `edl_depart` se signe sans `cgv_accept`. `fetch_contract_by_token` renvoie `sig_prop` et jamais `p_ass`. Commit `feat(db): documents signables, projection PDF, acceptation des conditions (migration 010)`.

### Task 11 : Contrat de réservation — retrait des équipements/état, prix, annulation

**Files:** Modify `web/app/index.html` : barre d'étapes (`:459-466`), sections `cs1` (supprimer), `cs4` (retirer la carte « État du véhicule au départ »), `cGo` (`:1595`), `chkSig` (`:1745`), `prefillContratFromDemande`, `selF` (`#cs4` → nouvel id), `buildRecap_c`, `genPDF_c`, `collectC`, `downloadContractPDF`.

- [ ] **Step 1.** Renuméroter : `cs0` Véhicule, `cs1` Proprio, `cs2` Conducteurs, `cs3` Location, `cs4` Signatures, `cs5` Récap ; `cprog` = `(n+1)/6*100` ; `chkSig` → `cGo(5)` ; `prefillContratFromDemande` → `cGo(2)`. Supprimer le `<div class="sec" id="cs1">` équipements et la variable `eqSel`/`togEq` du contrat (déplacés en Task 12).
- [ ] **Step 2.** Constante `const ANNULATION_TEXTE = "Toute annulation doit être notifiée par écrit à rb.concept.capso@gmail.com ; la date de réception fait foi. Plus de 30 jours avant le départ : remboursement intégral. De 15 à 30 jours inclus : 50 % remboursé. De 7 à 14 jours : 25 % remboursé. Moins de 7 jours : aucun remboursement. Les frais de service (70 €) ne sont pas remboursables.";` et `const TVA_MENTION = 'TVA non applicable, art. 293 B du CGI';`.
- [ ] **Step 3.** `collectC` ajoute `acompte` (= `Math.round(total_cents*0.3)`/100), `solde`, `tva_mention`, `annulation: ANNULATION_TEXTE`. Récap et PDF : section « CONDITIONS D'ANNULATION » (texte), lignes acompte/solde/TVA, « Conditions acceptées par le locataire le … » quand `cgv_accept_date` existe.
- [ ] **Step 4.** Tests node, contrôle visuel des 6 étapes, commit `feat(app): le contrat perd l'état des lieux, gagne le détail de prix et les conditions d'annulation`.

### Task 12 : Page « EDL départ »

**Files:** Modify `web/app/index.html` : nav (`:449-453`) + nouvelle `<div class="page" id="page-edl">` après `page-contrat`, JS : `eGo`, `loadEdlRef`, `collectE`, `saveAndShareE`, `chkLocSigE`, `genPDF_e`, canvas `initECv/clrESig/cfmESig`, `showPage`.

- [ ] **Step 1 : markup**, 6 sections `es0..es5` : Contrat associé (`eref_code`, bouton Charger, `eref_info`), Équipements (grille `eqi` déplacée, ids `eq_*`), État (`ecarbu`,`eeau`,`eetat`,`eprop`,`ecarro`,`ebat`,`ekm`,`eobs`), Vidéos (`evext`,`evint`,`evid`), Signatures (`ecv_prop`,`ecv_loc`, `elieu`), Récap (`recap_e`, PDF, zone partage `e_share_url`, `e_invite_email`, `epoll`, `epill`, `e_signed`).
- [ ] **Step 2 : JS.** `loadEdlRef()` : `sb.from('contracts').select('id,code,payload').eq('code',code).eq('type','presentiel')…` ; préremplit véhicule, locataire, dates, km départ (`p.km`). `collectE()` → `{ref_code, equipements:[…], km_dep, carbu, eau, etat, prop, carro, bat, obs, vid_ext, vid_int, vid_note, lieu, sig_prop, sig_prop_date}`. `saveAndShareE()` : `insertContract({code:'E'+code4, type:'edl_depart', vehicle, parent_id: edlParentId, payload})` — étendre `insertContract` pour transmettre `parent_id`. Polling `chkLocSigE` identique à `chkLocSigR`.
- [ ] **Step 3 : PDF.** `downloadContractPDF` : branche `edl_depart` (titre « ÉTAT DES LIEUX DE DÉPART », sections Contrat associé, Équipements, État, Vidéos, Signatures).
- [ ] **Step 4 : liste.** `listContracts` : `.not('type','in','("retour","edl_depart")')` ; `loadContractsList` charge aussi les `edl_depart` (map par `ref_code`) ; `renderContractCard` : badge/bouton EDL départ + PDF.
- [ ] **Step 5 : retour.** `loadRetourRef` charge aussi le dernier `edl_depart` (`retourDepartPayload`) ; `buildCmp` lit `retourDepartPayload[k] ?? v(did)` ; km départ depuis `retourDepartPayload.km_dep` ; `saveAndShareR` transmet `parent_id`.
- [ ] **Step 6.** Commit `feat(app): état des lieux de départ, document signable distinct du contrat`.

### Task 13 : Vue locataire — conditions, EDL départ, PDF

**Files:** Modify `web/app/index.html` : `page-locataire` (étapes `lc0..lc3` → ajouter « Conditions » avant la signature), `loc_already`, nouveau `loc_edl_main`, `initLocataire`, `envLocSig`, `lcRenderRecap`, `renderEdlLocataire`, `envLeSig`, `downloadMyPdf`.

- [ ] **Step 1.** Étape « Conditions » (`lc3`, la signature passe en `lc4`, barre à 5 étapes, `lcprog` = `(n+1)/5`) : `<div class="apercu"><h3>Conditions d'annulation</h3><p id="loc_annul"></p></div><label class="checkbox-item"><input type="checkbox" id="loc_cgv_ok"> J'ai lu et j'accepte les conditions d'annulation</label><p class="alert a-err" id="loc_cgv_err">Cochez la case pour continuer.</p>`. `lcNextFromCgv()` bloque si non coché. `envLocSig` : `patch.cgv_accept = true`.
- [ ] **Step 2.** `lcRenderRecap` : lignes `d.lignes` (via `fmtEuros`), acompte, solde, `d.tva_mention`.
- [ ] **Step 3.** `loc_edl_main` (copie de `loc_retour_main` : équipements + état + signature, ids `le_*`), `renderEdlLocataire(row)`, `envLeSig()` (patch `{}`). `initLocataire` : branche `row.type==='edl_depart'`.
- [ ] **Step 4.** PDF : `downloadMyPdf()` → `downloadContractPDF(locContract)` après rechargement par token (`fetchContractByToken`) pour avoir `signature_loc`. Bouton dans `loc_already`, `loc_success`, `lr_success`, `le_success`.
- [ ] **Step 5.** Commit `feat(app): conditions d'annulation à accepter, EDL départ et PDF côté locataire`.

### Task 14 : Edge Function typée

**Files:** Modify `supabase/functions/contract-email/index.ts` (`invite` et `signed`).

- [ ] **Step 1.** `const LIBELLES = { presentiel:'votre contrat de location', distance:'votre contrat de location', edl_depart:"votre état des lieux de départ", retour:'votre procès-verbal de retour' }; const lib = LIBELLES[contract.type] ?? 'votre document';` ; sujets « Votre contrat de location RB·CAPSO à signer » → `` `${lib[0].toUpperCase()+lib.slice(1)} RB·CAPSO à signer` `` ; corps idem ; notification : « Document signé ✓ » + libellé.
- [ ] **Step 2.** `deno check supabase/functions/contract-email/index.ts` si Deno présent, sinon relecture. Commit `feat(edge): emails d'invitation et de signature typés par document`. `ship push`, revue a11y, `ship ready`.

---

## PR 4 — `feat/identite-photos` (après merge de PR 3)

### Task 15 : Migration 011 — bucket, policies, RPC d'upload, purge

**Files:** Create `supabase/migrations/011_documents_bucket.sql`, Create `supabase/functions/documents-upload/index.ts`.

- [ ] **Step 1 : SQL**

```sql
create extension if not exists pg_cron;
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents','documents', false, 8388608, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin all documents" on storage.objects;
create policy "admin all documents" on storage.objects for all
  using (bucket_id = 'documents' and (auth.jwt() ->> 'email') in (select email from admins))
  with check (bucket_id = 'documents' and (auth.jwt() ->> 'email') in (select email from admins));
-- anon : aucune policy. L'upload locataire passe par l'Edge Function documents-upload
-- (service role) qui verifie le token et le statut pending avant de signer l'URL.

-- Reference du fichier dans le payload, validee par prefixe.
create or replace function attach_document_by_token(p_token text, p_kind text, p_path text)
returns void language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_payload jsonb;
begin
  if p_token is null or length(p_token) < 24 then raise exception 'token invalide'; end if;
  select id, payload into v_id, v_payload from contracts where access_token = p_token and status = 'pending' limit 1;
  if v_id is null then raise exception 'contrat introuvable ou deja signe'; end if;
  if p_kind = 'id_doc' then
    if p_path !~ ('^identites/' || v_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$') then raise exception 'chemin invalide'; end if;
    v_payload := jsonb_set(coalesce(v_payload,'{}'::jsonb), '{id_doc}', to_jsonb(p_path));
  else
    raise exception 'kind invalide';
  end if;
  update contracts set payload = v_payload where id = v_id;
end; $$;
grant execute on function attach_document_by_token(text,text,text) to anon, authenticated;

-- Purge : 6 mois apres la date de retour (payload.fin au format DD/MM/YYYY).
create or replace function purge_documents() returns integer language plpgsql security definer set search_path = public as $$
declare n integer := 0; r record;
begin
  for r in
    select c.id from contracts c
    where (c.payload ? 'id_doc' or c.payload ? 'photos')
      and c.payload->>'fin' ~ '^\d{2}/\d{2}/\d{4}$'
      and to_date(c.payload->>'fin','DD/MM/YYYY') < (current_date - interval '6 months')
  loop
    delete from storage.objects where bucket_id = 'documents' and (name like 'identites/' || r.id::text || '/%' or name like 'edl/' || r.id::text || '/%');
    update contracts set payload = (payload - 'id_doc') - 'photos' where id = r.id;
    n := n + 1;
  end loop;
  return n;
end; $$;
select cron.unschedule('purge_documents') where exists (select 1 from cron.job where jobname = 'purge_documents');
select cron.schedule('purge_documents', '15 3 * * *', $$select purge_documents()$$);
```

- [ ] **Step 2 : Edge Function `documents-upload`** (anon, POST `{token, kind, ext}`) : vérifie le token via `fetch_contract_by_token` (service role), `status === 'pending'`, `ext ∈ {jpg,jpeg,png,webp,pdf}`, construit `identites/<id>/<crypto.randomUUID()>.<ext>`, `supabase.storage.from('documents').createSignedUploadUrl(path)`, renvoie `{path, token: signedToken}`. CORS verrouillé comme `contract-email`.
- [ ] **Step 3 : tests locaux** (`supabase db reset`, appel `purge_documents()` sur un contrat fictif daté d'il y a 7 mois → références effacées). Commit `feat(db): bucket privé documents, upload par token, purge à 6 mois (migration 011)`.

### Task 16 : Interface upload (locataire + EDL) et confidentialité

**Files:** Modify `web/app/index.html` (étape Infos locataire ; pages EDL départ/retour), `web/index.html` (politique de confidentialité ~`:2540-2548`).

- [ ] **Step 1 : locataire.** `<div class="ff"><label for="loc_iddoc">Photo de votre pièce d'identité</label><input type="file" id="loc_iddoc" accept="image/*,application/pdf" capture="environment" aria-describedby="loc_iddoc_hint"><p class="hint" id="loc_iddoc_hint">8 Mo max. Conservée 6 mois après la location, puis supprimée. Sinon, envoyez-la en réponse à l'email de confirmation.</p><img id="loc_iddoc_prev" alt="" hidden></div>`. `uploadIdDoc(file)` : taille ≤ 8 Mo, `sb.functions.invoke('documents-upload',{body:{token,kind:'id_doc',ext}})`, `sb.storage.from('documents').uploadToSignedUrl(path, signedToken, file)`, `sb.rpc('attach_document_by_token',{p_token,p_kind:'id_doc',p_path})`, statut annoncé dans un `role="status"`.
- [ ] **Step 2 : EDL admin.** Champ multiple `accept="image/*" capture="environment"` sur les pages EDL départ et retour ; upload direct admin `sb.storage.from('documents').upload('edl/<contractId>/<depart|retour>/<uuid>.<ext>', file)` ; `payload.photos = [{path, at, kind}]` ; vignettes via `createSignedUrl(path, 600)` ; page retour affiche les photos de départ en regard.
- [ ] **Step 3 : confidentialité** (site) : nouvelle `<li>` « Copie de la pièce d'identité et photos d'état des lieux » dans « Données collectées », et paragraphe dans « Durée de conservation » : « La copie de la pièce d'identité et les photos d'état des lieux sont conservées 6 mois après la fin de la location, puis supprimées automatiquement. »
- [ ] **Step 4.** Commit, `ship push`, revue a11y, `ship ready`.

---

## PR 5 — `feat/stripe-acompte` (après merge de PR 3, compte Stripe vérifié)

### Task 17 : Migration 012 + Edge Functions Stripe

**Files:** Create `supabase/migrations/012_paiements.sql`, `supabase/functions/payment-link/index.ts`, `supabase/functions/stripe-webhook/index.ts`.

- [ ] **Step 1 : SQL** : `alter table contracts add column if not exists paiements jsonb not null default '{}'::jsonb;` + ajout de `'paiements_stripe'` … (la colonne est hors payload : l'ajouter au `jsonb_build_object` de `fetch_contract_by_token` en `'paiements_stripe', c.paiements`). Fonction `mark_payment_paid(p_stripe_id text, p_kind text, p_contract uuid)` (service role only, `revoke execute … from anon, authenticated`).
- [ ] **Step 2 : `payment-link`** (admin JWT vérifié comme `contract-email`) : `POST {contract_id, kind}` ; montant : `acompte = Math.round(total_cents*0.3)`, `solde = total_cents - acompte` ; `fetch('https://api.stripe.com/v1/payment_links', {headers:{Authorization:'Bearer '+STRIPE_SECRET_KEY}, body: form})` avec `line_items[0][price_data][currency]=eur`, `unit_amount`, `product_data[name]="Location RB·CAPSO #<code> — acompte"`, `metadata[contract_id]`, `metadata[kind]`, `after_completion[type]=redirect`, `after_completion[redirect][url]=APP_URL?t=<token>&paye=<kind>` ; stocke `{cents,url,stripe_id,status:'pending'}` dans `contracts.paiements[kind]`.
- [ ] **Step 3 : `stripe-webhook`** : vérifie `Stripe-Signature` (HMAC SHA-256 du `t.payload` avec `STRIPE_WEBHOOK_SECRET`, tolérance 5 min), `checkout.session.completed` → `metadata.contract_id/kind` → `mark_payment_paid` ; email Resend à Romain « Acompte reçu · #code · X € ». Répond 200 même pour les événements ignorés.
- [ ] **Step 4 : tests** : signature webhook vérifiée avec un secret de test et un payload fabriqué (script node) ; Payment Link créé en mode test et ouvert dans le navigateur. Commit `feat(paiement): Payment Links Stripe acompte/solde et webhook (migration 012)`.

### Task 18 : Interface paiement

**Files:** Modify `web/app/index.html` (zone partage contrat : boutons « Générer le lien d'acompte / du solde », statut ; vue locataire : bloc « Régler l'acompte » + récapitulatif ; `loc_already` : statut payé), `supabase/functions/contract-email/index.ts` (lien d'acompte dans l'invitation si présent).

- [ ] **Step 1.** Admin : `genererLienPaiement(kind)` → `sb.functions.invoke('payment-link',{body:{contract_id:cId,kind}})` ; affiche URL + « Copier » ; pastille `paiements[kind].status`.
- [ ] **Step 2.** Locataire : après signature (et dans `loc_already`), si `paiements_stripe.acompte.url` : bouton `<a class="btn btn-p" href="…" rel="noopener">Régler l'acompte de X €</a>` ; récapitulatif : location, options, frais de service, total, acompte, solde, « Caution 2 000 € par chèque à la remise », TVA 293 B. Paramètre `?paye=acompte` → message « Paiement reçu, merci ».
- [ ] **Step 3.** Commit, `ship push`, revue a11y, `ship ready`. Bascule live : remplacer les deux secrets Supabase (Antonin/Romain).

---

## Ordre d'application en prod (à chaque PR, sur OK d'Antonin)

1. `supabase db push` (ou la migration via l'API de management) — vérifier `select proname, pronargs from pg_proc where proname='submit_booking'` après 009.
2. `supabase functions deploy contract-email` (PR 3), `documents-upload` (PR 4), `payment-link` + `stripe-webhook` (PR 5) ; secrets posés avant.
3. Merge de la PR (déploiement Vercel automatique, ~30 s).
4. Contrôle : une demande de test sur le site, un contrat de test dans `/app`, suppression des deux.
