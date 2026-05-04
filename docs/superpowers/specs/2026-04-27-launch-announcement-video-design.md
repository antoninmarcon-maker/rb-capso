# Launch Announcement Video — Design Spec

**Date** : 2026-04-27
**Statut** : design validé, à implémenter
**Cible** : nouvelle composition Remotion pour annoncer la mise en ligne du site RB-CapSO

---

## 1. Contexte et objectif

Le site RB-CapSO (`rb-capso.vercel.app`, futur `rb-capso.fr`) vient d'être finalisé après refonte (Next.js 15, design system modernisé, contenu blog ajouté, contacts WhatsApp/téléphone intégrés).

Romain, le fondateur, a besoin d'une vidéo courte qu'il puisse partager facilement pour annoncer cette mise en ligne. Le canal cible principal est WhatsApp et les stories Instagram (`@Rb.capso`), avec un format vertical court qui se lit muet.

La vidéo doit reprendre les ingrédients visuels et éditoriaux de la home (Hero, vans Pénélope/Peggy, ConceptionTeaser, tagline) pour assurer la cohérence avec le site.

Livrable parallèle : un message court à envoyer à Romain avec le lien du site et la vidéo en pièce jointe.

## 2. Décisions arbitrées

| # | Décision | Choix | Justification |
|---|---|---|---|
| 1 | Format | 9:16 (1080×1920) | WhatsApp + stories Insta, partage facile par Romain |
| 2 | Durée | 17 s (510 frames @ 30 fps) | Au-dessus de 20 s, la rétention chute en story |
| 3 | Ton | Annonce sobre artisan | Aligné BRIEF.md §9 (cuts francs, pas de glitch, sobriété) |
| 4 | Source visuelle | Photos `apps/web/public/` + texte kinétique | Pas de clip vidéo importé : rendu rapide, pas de dépendance ffmpeg lourde |
| 5 | Son | Muet | Stories autoplay muet, WhatsApp lit silencieux. Le montage doit fonctionner sans son |
| 6 | Outil | Remotion v4 (déjà en place dans `apps/video`) | Existe, design tokens partagés via `@rb-capso/design-tokens` |
| 7 | Adresse client | Vouvoiement | Règle transversale du projet (BRIEF.md) |

## 3. Architecture technique

### 3.1 Emplacement

Nouvelle composition dans le monorepo existant :

```
apps/video/
  src/
    compositions/
      LaunchAnnouncement/
        index.tsx          # composition principale
        cards/
          LogoCard.tsx     # cartes 1 et 7 (logo plein cadre)
          PhotoCard.tsx    # cartes 2 à 6 (photo + overlay texte)
        animations.ts      # helpers spring/interpolate factorisés
    Root.tsx               # registerRoot — ajouter <Composition id="LaunchAnnouncement" />
  public/
    photos/                # copies locales des assets
      atelier-menuiserie.jpg
      van-penelope.jpg
      van-peggy.jpg
      mains-atelier.jpg
      hero-poster.jpg
      logo-rb-capso.png
```

### 3.2 Schéma Zod

```ts
export const launchAnnouncementSchema = z.object({
  siteUrl: z.string().default("rb-capso.fr"),
});
```

`siteUrl` paramétrable permet de re-rendre une variante avec `rb-capso.vercel.app` avant la bascule DNS sans toucher au code.

### 3.3 Métadonnées

```ts
<Composition
  id="LaunchAnnouncement"
  component={LaunchAnnouncement}
  durationInFrames={510}
  fps={30}
  width={1080}
  height={1920}
  schema={launchAnnouncementSchema}
  defaultProps={{ siteUrl: "rb-capso.fr" }}
/>
```

### 3.4 Design tokens

Réutilisation stricte de `@rb-capso/design-tokens` via le re-export local `apps/video/src/theme/index.ts` :

- `colors.cream` (`#EFE8DC`) — fond des cartes logo
- `colors.ink` (`#1E2A24`) — texte principal
- `colors.sage` (`#8AA18A`) — labels secondaires (ville, modèle)
- `colors.wood` (`#C6A36B`) — accent URL
- `colors.ocean` (`#365A6B`) — non utilisé ici, réservé

**Note importante sur les fonts** : la home a été migrée sur **Geist** (via `next/font/google`) lors de la refonte du design system. Le package `@rb-capso/design-tokens` mentionne encore GT Sectra/Söhne dans `fonts.display` / `fonts.body` mais ce token est obsolète et la chaîne fallback couvre le manque. La vidéo utilise donc **Geist en titre et corps** pour être visuellement cohérente avec le site actuel. Mise à jour du token : hors-scope ici, à traiter dans une tâche dédiée.

- Titres et tagline : `Geist` (weight 600 ou 700 selon contexte)
- Labels et URL : `Geist` (weight 400 ou 500)

## 4. Storyboard détaillé

| # | Card | t (s) | Frames | Visuel | Texte | Animation |
|---|---|---|---|---|---|---|
| 1 | LogoCard | 0.0–1.5 | 0–45 | Fond `cream` | Logo RB-CapSO centré | Logo : spring opacity 0→1 sur 24f, scale 0.92→1 |
| 2 | PhotoCard | 1.5–4.0 | 45–120 | `atelier-menuiserie.jpg` | Titre : `Atelier RB-CapSO`<br>Sous-titre : `Capbreton, Landes` | Ken Burns scale 1.00→1.04, texte slide-up 18px + fade-in @ frame 60 |
| 3 | PhotoCard | 4.0–6.5 | 120–195 | `van-penelope.jpg` | Titre : `Pénélope`<br>Sous-titre : `Ford Transit Custom` | Idem, label en bas |
| 4 | PhotoCard | 6.5–9.0 | 195–270 | `van-peggy.jpg` | Titre : `Peggy`<br>Sous-titre : `Fiat Ducato L2H2` | Idem, label en haut (varier la position) |
| 5 | PhotoCard | 9.0–11.0 | 270–330 | `mains-atelier.jpg` | Titre : `Aménagement sur-mesure` | Ken Burns plus lent, sans sous-titre |
| 6 | PhotoCard | 11.0–14.0 | 330–420 | `hero-poster.jpg` | Tagline 2 lignes : `Fait main,` / `pour prendre le large.` | Pas de Ken Burns. Texte ligne 1 fade-in @ 345f, ligne 2 @ 375f |
| 7 | LogoCard | 14.0–17.0 | 420–510 | Fond `cream` | Logo (haut)<br>`Le site est en ligne` (centre, GT Sectra)<br>`{siteUrl}` (bas, Söhne, couleur wood) | Logo fade-in 420–438, message 444–462, URL 468–486 |

### 4.1 Règles de transition

- **Cuts francs** entre cartes (frame N : carte X disparaît, frame N+1 : carte X+1 apparaît). Pas de cross-fade, pas de fade-to-black, pas de wipe.
- Les animations internes à chaque carte (spring, interpolate) gèrent la respiration. Pas besoin de transition globale.

### 4.2 Lisibilité texte sur photos

Pour les cards 2 à 6 qui superposent du texte sur photo, ajouter un dégradé linéaire `linear-gradient(0deg, rgba(30,42,36,0.55) 0%, transparent 35%)` (ou inversé si label en haut) sur 30 % de la hauteur côté texte. Garantit le contraste sans assombrir toute l'image.

## 5. Composants

### 5.1 `LogoCard`

```ts
type LogoCardProps = {
  variant: "intro" | "outro";
  siteUrl?: string;
  startFrame: number;
  durationFrames: number;
};
```

- Variante `intro` : logo seul, centré.
- Variante `outro` : logo en haut, baseline `Le site est en ligne` au centre, URL en bas.
- Animations relatives à `startFrame` (chaque card calcule son frame local via `frame - startFrame`).

### 5.2 `PhotoCard`

```ts
type PhotoCardProps = {
  imageSrc: string;        // staticFile path
  title: string;
  subtitle?: string;
  labelPosition: "top" | "bottom";
  startFrame: number;
  durationFrames: number;
  kenBurns?: { from: number; to: number }; // ex: { from: 1.0, to: 1.04 }
};
```

- `Img` Remotion avec `transform: scale(...)` interpolé sur la durée totale de la card.
- Overlay dégradé conditionnel selon `labelPosition`.
- Texte avec spring opacity et translation Y.

### 5.3 Composition principale `LaunchAnnouncement`

Utilise `<Sequence>` Remotion pour scoper chaque card sur sa fenêtre temporelle :

```tsx
<AbsoluteFill>
  <Sequence from={0} durationInFrames={45}>
    <LogoCard variant="intro" startFrame={0} durationFrames={45} />
  </Sequence>
  <Sequence from={45} durationInFrames={75}>
    <PhotoCard imageSrc="photos/atelier-menuiserie.jpg" ... />
  </Sequence>
  ... etc.
  <Sequence from={420} durationInFrames={90}>
    <LogoCard variant="outro" siteUrl={siteUrl} ... />
  </Sequence>
</AbsoluteFill>
```

`<Sequence>` gère le cut franc gratuitement (avant `from`, le contenu n'existe pas).

## 6. Gestion des fonts

Le dossier `apps/video/public/fonts/` est actuellement vide. La home utilise Geist via `next/font/google`. Pour Remotion, deux options :

- **Préférée : `@remotion/google-fonts/Geist`** — package officiel Remotion qui gère le chargement via `delayRender`/`continueRender` automatiquement. À installer : `pnpm --filter video add @remotion/google-fonts`.
  ```ts
  import { loadFont } from "@remotion/google-fonts/Geist";
  const { fontFamily } = loadFont();
  ```
- **Fallback** : si `@remotion/google-fonts` ne fournit pas Geist directement, utiliser `loadFont("normal", { weights: ["400","500","600","700"] })` ou télécharger les `.woff2` depuis Google Fonts dans `public/fonts/Geist/` et charger via `FontFace` + `delayRender`/`continueRender` (pattern documenté VIDEO.md §3).

Stack fallback CSS : `Geist, ui-sans-serif, system-ui, -apple-system, sans-serif`. Si la font ne charge pas, le rendu reste lisible sur Geist équivalent système.

## 7. Assets

### 7.1 Source

Les photos vivent dans `apps/web/public/`. Six fichiers à rendre disponibles côté Remotion :

| Fichier source | Usage |
|---|---|
| `atelier-menuiserie.jpg` | Card 2 (atelier) |
| `van-penelope.jpg` | Card 3 (Pénélope) |
| `van-peggy.jpg` | Card 4 (Peggy) |
| `mains-atelier.jpg` | Card 5 (sur-mesure) |
| `video/hero-poster.jpg` | Card 6 (drone falaise Cantabrie) |
| `logo-rb-capso.png` | Cards 1 et 7 |

### 7.2 Stratégie

**Copie ponctuelle** dans `apps/video/public/photos/` (≈ 1.5 Mo total). Choix justifié :

- Remotion `staticFile()` ne sait pas lire en dehors de `public/` de l'app
- Symlinks fragiles entre packages dans pnpm monorepo
- Script de sync ajouterait de la complexité pour 6 fichiers stables

Trade-off accepté : si un asset web change (ex : nouvelle photo van), il faut re-copier. Documenté dans le README du dossier `photos/`.

## 8. Render

### 8.1 Script package.json

Ajouter dans `apps/video/package.json` :

```json
"render:launch": "remotion render LaunchAnnouncement out/launch-9x16.mp4 --codec h264 --crf 18"
```

### 8.2 Cibles de qualité

- 1080×1920 H.264, CRF 18
- Cible poids ≈ 1.5–2 Mo pour 17 s
- Audio : aucun (`--codec h264` seul, pas de track audio)

### 8.3 Validation

Après render, vérifier :

- Lecture sur iOS Safari (Story Insta) sans glitch
- Lecture sur WhatsApp Web et mobile (compatibilité H.264 baseline)
- Poids final < 4 Mo (limite WhatsApp confortable)

## 9. Message à Romain (livrable parallèle)

À envoyer en SMS ou WhatsApp avec la vidéo en pièce jointe et le lien.

```
Bonjour Romain,

Voici le site finalisé : https://rb-capso.vercel.app

Et une courte vidéo d'annonce (17 secondes, format vertical) que vous pouvez poster sur le compte @Rb.capso ou envoyer aux clients qui demandent le lien.

Prenez le temps de tout regarder, et envoyez-moi vos retours avant qu'on bascule le nom de domaine sur rb-capso.fr.

Bonne soirée.
```

Règles d'écriture respectées (BRIEF.md) : vouvoiement, pas d'emoji, pas d'em-dash, pas de « partenaire de confiance » ni « expertise ».

À sauvegarder dans `tasks/PROMPTS.md` (collection des templates) ou `tasks/EMAILS.md` une fois validé par Romain, pour réutilisation lors d'une future mise à jour.

## 10. Hors-scope

Explicitement exclu de cette livraison :

- Variante 16:9 pour embed site ou LinkedIn (V2 si demande)
- Musique de fond (V2 via Epidemic Sound, déjà budgété au plan)
- Voix-off (le BRIEF interdit la voix-off agence ; seule celle de Romain serait acceptable, hors-scope)
- Sous-titres burned-in (pas pertinent à 17 s sans dialogue)
- Animation grain 35 mm (pertinent sur hero film 75 s, surdimensionné pour 17 s annonce)
- Render Lambda (volume MVP largement sous le seuil de 30 rendus/mois)
- Mise à jour du nom des vans dans `QuoteCard` existant (Marceau/Lazare → Pénélope/Peggy) : à traiter dans une tâche séparée, pas mélangée à cette annonce

## 11. Risques et atténuations

| Risque | Probabilité | Impact | Atténuation |
|---|---|---|---|
| `@remotion/google-fonts/Geist` non disponible | Faible | Fallback CSS (Geist système ou ui-sans-serif) | Stack fallback définie. Solution alternative `.woff2` documentée §6 |
| Photos source modifiées côté `apps/web/public/` | Faible | Désynchronisation visuelle | README dans `apps/video/public/photos/` listant la provenance |
| Rendu local trop lent sur Mac M-series | Faible | Itération laborieuse | Remotion v4 + Apple Silicon est rapide ; pas d'enjeu pour 17 s |
| Romain veut une variante avec son ou sous-titres après V1 | Moyenne | Re-travail | V2 prévue dans hors-scope, schema Zod déjà extensible |

## 12. Critères de succès

La V1 est livrée quand :

1. `pnpm --filter video render:launch` produit `out/launch-9x16.mp4` sans erreur
2. Le fichier mesure 1.5–3 Mo, dure 17 s, lit sur iOS/Android
3. Le rendu correspond visuellement au storyboard (ordre des cards, textes exacts)
4. Le studio Remotion (`pnpm --filter video studio`) affiche la composition `LaunchAnnouncement` et permet le scrub
5. Les couleurs et fonts sont cohérentes avec la home du site
6. Le message à Romain est sauvegardé (à minima dans le spec, idéalement dans `tasks/PROMPTS.md`)
