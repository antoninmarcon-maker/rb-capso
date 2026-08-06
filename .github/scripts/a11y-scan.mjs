/*
 * Scan d'accessibilité des pages statiques de web/ (WCAG 2.1 AA).
 *
 * Pourquoi Playwright plutôt que @axe-core/cli : ce dernier passe par un
 * chromedriver téléchargé séparément, qui se désynchronise du Chrome préinstallé
 * du runner (« This version of ChromeDriver only supports Chrome version 151 »).
 * Playwright embarque son propre navigateur : plus de décalage de version.
 * C'est aussi la stack déjà utilisée par Nutrisecure — une seule à connaître.
 *
 * Les dépendances sont installées dans un dossier temporaire par la CI : rien
 * n'est ajouté au dépôt, qui reste « zéro dépendance ».
 *
 * Usage : BASE_URL=http://localhost:8080 node a11y-scan.mjs
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';

const BASE = process.env.BASE_URL ?? 'http://localhost:8080';
const PAGES = ['/', '/calendar/', '/app/', '/stats/'];
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

// Dette connue : ces couples page+règle ne font pas échouer la PR, mais toute
// NOUVELLE violation, si. Voir .github/a11y-baseline.json pour le pourquoi.
const BASELINE_PATH = process.env.BASELINE_PATH ?? 'a11y-baseline.json';
const baseline = new Set(
  JSON.parse(readFileSync(BASELINE_PATH, 'utf8')).violations.map((v) => `${v.page}|${v.rule}`),
);
const seen = new Set();

const browser = await chromium.launch();
const context = await browser.newContext();
let total = 0;

for (const path of PAGES) {
  const page = await context.newPage();
  const url = `${BASE}${path}`;
  let result;
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 });
    result = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  } catch (err) {
    console.log(`\n=== ${path} — ERREUR DE CHARGEMENT`);
    console.log(`    ${err.message}`);
    total += 1;
    await page.close();
    continue;
  }

  const v = result.violations;
  console.log(`\n=== ${path} — ${v.length} violation(s)`);
  for (const issue of v) {
    const key = `${path}|${issue.id}`;
    seen.add(key);
    const known = baseline.has(key);
    if (!known) total += 1;
    console.log(`  ${known ? '(dette connue)' : 'NOUVEAU'} [${issue.impact ?? 'n/a'}] ${issue.id} — ${issue.help}`);
    console.log(`      ${issue.helpUrl}`);
    // Les 3 premiers nœuds suffisent à localiser : au-delà c'est le même défaut répété.
    for (const node of issue.nodes.slice(0, 3)) {
      console.log(`      → ${node.target.join(' ')}`);
    }
    if (issue.nodes.length > 3) {
      console.log(`      … et ${issue.nodes.length - 3} autre(s) occurrence(s)`);
    }
  }
  await page.close();
}

await browser.close();

// Une entrée du baseline qui ne se reproduit plus a été corrigée : on le dit,
// et on exige son retrait. C'est ce qui empêche la liste de rester figée.
const corrigees = [...baseline].filter((k) => !seen.has(k));
if (corrigees.length > 0) {
  console.log('\nCorrigé(s) — à retirer de .github/a11y-baseline.json :');
  for (const k of corrigees) {
    const [page, rule] = k.split('|');
    console.log(`  ${rule} sur ${page}`);
  }
  process.exit(1);
}

if (total > 0) {
  console.log(`\n${total} NOUVELLE(s) violation(s) — la PR ne peut pas passer.`);
  console.log('Corrige-les : ne les ajoute pas au baseline.');
  process.exit(1);
}
console.log(`\nAucune nouvelle violation WCAG 2.1 AA (${baseline.size} dette(s) connue(s) restante(s)).`);
