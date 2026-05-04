# Launch Announcement Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 17-second 9:16 Remotion composition `LaunchAnnouncement` that announces the RB-CapSO website launch using homepage assets, and prepare the message Romain will send with the link.

**Architecture:** Single Remotion composition using `<Sequence>` for hard cuts between 7 cards (1 intro logo, 5 photo cards with kinetic text, 1 outro with URL). Two reusable sub-components (`LogoCard`, `PhotoCard`) keep card logic isolated and testable. Animation timing helpers factored into `animations.ts`. Photos copied from `apps/web/public/` to `apps/video/public/photos/`. Geist font loaded via `@remotion/google-fonts`.

**Tech Stack:** Remotion v4, React 19, TypeScript 5.5, Zod for schema, pnpm workspaces (`@rb-capso/design-tokens` for colors).

**Spec reference:** [docs/superpowers/specs/2026-04-27-launch-announcement-video-design.md](../specs/2026-04-27-launch-announcement-video-design.md)

---

## Conventions for this plan

**Working directory:** All commands assume you are in the monorepo root: `/Users/antoninmarcon/Documents/Projects/RB CAPSO/code/`. The video app is at `apps/video/`.

**Verification:** Remotion compositions are visual; classic unit tests don't apply. Each task is verified by:
1. TypeScript compile check (`pnpm --filter video exec tsc --noEmit`)
2. Frame still extraction (`pnpm --filter video exec remotion still <id> <output> --frame=<N>`) for visual diff at key frames
3. Final task does a full render

**Commits:** One commit per task. Use Conventional Commits (`feat:`, `chore:`, `refactor:`).

---

## Task 1: Copy photo assets and document provenance

**Files:**
- Create: `apps/video/public/photos/atelier-menuiserie.jpg`
- Create: `apps/video/public/photos/van-penelope.jpg`
- Create: `apps/video/public/photos/van-peggy.jpg`
- Create: `apps/video/public/photos/mains-atelier.jpg`
- Create: `apps/video/public/photos/hero-poster.jpg`
- Create: `apps/video/public/photos/logo-rb-capso.png`
- Create: `apps/video/public/photos/README.md`

- [ ] **Step 1: Create the photos directory and copy assets**

```bash
mkdir -p apps/video/public/photos
cp apps/web/public/atelier-menuiserie.jpg apps/video/public/photos/atelier-menuiserie.jpg
cp apps/web/public/van-penelope.jpg apps/video/public/photos/van-penelope.jpg
cp apps/web/public/van-peggy.jpg apps/video/public/photos/van-peggy.jpg
cp apps/web/public/mains-atelier.jpg apps/video/public/photos/mains-atelier.jpg
cp apps/web/public/video/hero-poster.jpg apps/video/public/photos/hero-poster.jpg
cp apps/web/public/logo-rb-capso.png apps/video/public/photos/logo-rb-capso.png
```

- [ ] **Step 2: Verify all six files are present and non-empty**

Run: `ls -la apps/video/public/photos/`
Expected: 6 files, each > 10 KB.

- [ ] **Step 3: Write the README documenting provenance**

File: `apps/video/public/photos/README.md`

```markdown
# Photos — Launch Announcement

These files are copied from `apps/web/public/` to be available to Remotion via `staticFile()`.
Remotion cannot read outside its own `public/` directory.

| File | Source | Used by |
|---|---|---|
| atelier-menuiserie.jpg | apps/web/public/atelier-menuiserie.jpg | LaunchAnnouncement card 2 |
| van-penelope.jpg | apps/web/public/van-penelope.jpg | LaunchAnnouncement card 3 |
| van-peggy.jpg | apps/web/public/van-peggy.jpg | LaunchAnnouncement card 4 |
| mains-atelier.jpg | apps/web/public/mains-atelier.jpg | LaunchAnnouncement card 5 |
| hero-poster.jpg | apps/web/public/video/hero-poster.jpg | LaunchAnnouncement card 6 |
| logo-rb-capso.png | apps/web/public/logo-rb-capso.png | LaunchAnnouncement cards 1 and 7 |

If a source asset changes on the web side, re-copy here. There is no automated sync.
```

- [ ] **Step 4: Commit**

```bash
git add apps/video/public/photos/
git commit -m "chore(video): copy launch announcement photo assets from web app"
```

---

## Task 2: Add @remotion/google-fonts dependency

**Files:**
- Modify: `apps/video/package.json`

- [ ] **Step 1: Install the package**

```bash
pnpm --filter video add @remotion/google-fonts@^4.0.0
```

- [ ] **Step 2: Verify it appears in dependencies**

Run: `grep "@remotion/google-fonts" apps/video/package.json`
Expected: line showing `"@remotion/google-fonts": "^4.0.0"` (or compatible 4.x).

- [ ] **Step 3: Verify Geist is available in the package**

Run: `ls node_modules/.pnpm/@remotion+google-fonts*/node_modules/@remotion/google-fonts/Geist.* 2>/dev/null || find node_modules/@remotion/google-fonts -name "Geist*" 2>/dev/null | head`
Expected: at least one `Geist.js` or `Geist.mjs` file. If empty, Geist must be loaded manually (manual loader fallback documented in Task 6 step 3).

- [ ] **Step 4: Commit**

```bash
git add apps/video/package.json pnpm-lock.yaml
git commit -m "chore(video): add @remotion/google-fonts for Geist font loading"
```

---

## Task 3: Create animation helpers module

**Files:**
- Create: `apps/video/src/compositions/LaunchAnnouncement/animations.ts`

- [ ] **Step 1: Create the directory**

```bash
mkdir -p apps/video/src/compositions/LaunchAnnouncement/cards
```

- [ ] **Step 2: Write the animations module**

File: `apps/video/src/compositions/LaunchAnnouncement/animations.ts`

```ts
import { interpolate, spring, type SpringConfig } from "remotion";

const DEFAULT_SPRING: SpringConfig = {
  damping: 200,
  stiffness: 100,
  mass: 0.5,
};

export function fadeInSpring(
  frame: number,
  startFrame: number,
  fps: number,
  durationInFrames = 24,
): number {
  return spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames,
    config: DEFAULT_SPRING,
  });
}

export function fadeOut(
  frame: number,
  startFrame: number,
  durationInFrames = 18,
): number {
  return interpolate(
    frame,
    [startFrame, startFrame + durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
}

export function kenBurnsScale(
  frame: number,
  totalFrames: number,
  from = 1.0,
  to = 1.04,
): number {
  return interpolate(frame, [0, totalFrames], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

export function slideUp(
  frame: number,
  startFrame: number,
  fps: number,
  distancePx = 18,
): number {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 24,
    config: DEFAULT_SPRING,
  });
  return distancePx * (1 - progress);
}
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter video exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/compositions/LaunchAnnouncement/animations.ts
git commit -m "feat(video): add animation helpers for launch announcement"
```

---

## Task 4: Build LogoCard component

**Files:**
- Create: `apps/video/src/compositions/LaunchAnnouncement/cards/LogoCard.tsx`

- [ ] **Step 1: Write the LogoCard component**

File: `apps/video/src/compositions/LaunchAnnouncement/cards/LogoCard.tsx`

```tsx
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../../../theme";
import { fadeInSpring } from "../animations";

const GEIST_STACK = "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif";

type LogoCardProps =
  | { variant: "intro" }
  | { variant: "outro"; siteUrl: string };

export function LogoCard(props: LogoCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (props.variant === "intro") {
    const logoOpacity = fadeInSpring(frame, 0, fps, 24);
    const logoScale = 0.92 + 0.08 * logoOpacity;

    return (
      <AbsoluteFill
        style={{
          backgroundColor: colors.cream,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Img
          src={staticFile("photos/logo-rb-capso.png")}
          style={{
            width: 520,
            height: "auto",
            opacity: logoOpacity,
            transform: `scale(${logoScale})`,
          }}
        />
      </AbsoluteFill>
    );
  }

  const logoOpacity = fadeInSpring(frame, 0, fps, 18);
  const messageOpacity = fadeInSpring(frame, 24, fps, 18);
  const urlOpacity = fadeInSpring(frame, 48, fps, 18);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.cream,
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "260px 80px",
      }}
    >
      <Img
        src={staticFile("photos/logo-rb-capso.png")}
        style={{
          width: 360,
          height: "auto",
          opacity: logoOpacity,
        }}
      />

      <div
        style={{
          fontFamily: GEIST_STACK,
          fontSize: 78,
          fontWeight: 600,
          color: colors.ink,
          textAlign: "center",
          letterSpacing: -1.5,
          lineHeight: 1.1,
          opacity: messageOpacity,
        }}
      >
        Le site est en ligne
      </div>

      <div
        style={{
          fontFamily: GEIST_STACK,
          fontSize: 56,
          fontWeight: 500,
          color: colors.wood,
          letterSpacing: 1,
          opacity: urlOpacity,
        }}
      >
        {props.siteUrl}
      </div>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter video exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/video/src/compositions/LaunchAnnouncement/cards/LogoCard.tsx
git commit -m "feat(video): add LogoCard component (intro and outro variants)"
```

---

## Task 5: Build PhotoCard component

**Files:**
- Create: `apps/video/src/compositions/LaunchAnnouncement/cards/PhotoCard.tsx`

- [ ] **Step 1: Write the PhotoCard component**

File: `apps/video/src/compositions/LaunchAnnouncement/cards/PhotoCard.tsx`

```tsx
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../../../theme";
import { fadeInSpring, kenBurnsScale, slideUp } from "../animations";

const GEIST_STACK = "Geist, ui-sans-serif, system-ui, -apple-system, sans-serif";

type PhotoCardProps = {
  imageSrc: string;
  title: string;
  subtitle?: string;
  labelPosition: "top" | "bottom";
  durationInFrames: number;
  textStartFrame?: number;
  subtitleDelayFrames?: number;
  kenBurns?: { from: number; to: number };
};

export function PhotoCard({
  imageSrc,
  title,
  subtitle,
  labelPosition,
  durationInFrames,
  textStartFrame = 12,
  subtitleDelayFrames = 8,
  kenBurns = { from: 1.0, to: 1.04 },
}: PhotoCardProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = kenBurnsScale(frame, durationInFrames, kenBurns.from, kenBurns.to);
  const titleOpacity = fadeInSpring(frame, textStartFrame, fps, 18);
  const titleSlide = slideUp(frame, textStartFrame, fps, 18);
  const subtitleOpacity = fadeInSpring(frame, textStartFrame + subtitleDelayFrames, fps, 18);

  const overlayGradient =
    labelPosition === "bottom"
      ? "linear-gradient(0deg, rgba(30,42,36,0.55) 0%, transparent 35%)"
      : "linear-gradient(180deg, rgba(30,42,36,0.55) 0%, transparent 35%)";

  const labelStyle: React.CSSProperties = {
    position: "absolute",
    left: 80,
    right: 80,
    [labelPosition === "bottom" ? "bottom" : "top"]: 140,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: colors.ink, overflow: "hidden" }}>
      <Img
        src={staticFile(imageSrc)}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      />
      <AbsoluteFill
        style={{
          background: overlayGradient,
          pointerEvents: "none",
        }}
      />
      <div style={labelStyle}>
        <div
          style={{
            fontFamily: GEIST_STACK,
            fontSize: 88,
            fontWeight: 600,
            color: colors.cream,
            letterSpacing: -1.5,
            lineHeight: 1.05,
            opacity: titleOpacity,
            transform: `translateY(${titleSlide}px)`,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontFamily: GEIST_STACK,
              fontSize: 36,
              fontWeight: 400,
              color: colors.sage,
              letterSpacing: 0.5,
              opacity: subtitleOpacity,
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter video exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/video/src/compositions/LaunchAnnouncement/cards/PhotoCard.tsx
git commit -m "feat(video): add PhotoCard component with Ken Burns and overlay"
```

---

## Task 6: Build LaunchAnnouncement composition with font loading

**Files:**
- Create: `apps/video/src/compositions/LaunchAnnouncement/index.tsx`

- [ ] **Step 1: Write the composition**

File: `apps/video/src/compositions/LaunchAnnouncement/index.tsx`

```tsx
import { AbsoluteFill, Sequence } from "remotion";
import { z } from "zod";
import { loadFont } from "@remotion/google-fonts/Geist";
import { LogoCard } from "./cards/LogoCard";
import { PhotoCard } from "./cards/PhotoCard";

loadFont("normal", { weights: ["400", "500", "600", "700"] });

export const launchAnnouncementSchema = z.object({
  siteUrl: z.string().default("rb-capso.fr"),
});

export type LaunchAnnouncementProps = z.infer<typeof launchAnnouncementSchema>;

export function LaunchAnnouncement({ siteUrl }: LaunchAnnouncementProps) {
  return (
    <AbsoluteFill>
      <Sequence from={0} durationInFrames={45}>
        <LogoCard variant="intro" />
      </Sequence>

      <Sequence from={45} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/atelier-menuiserie.jpg"
          title="Atelier RB-CapSO"
          subtitle="Capbreton, Landes"
          labelPosition="bottom"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={120} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/van-penelope.jpg"
          title="Pénélope"
          subtitle="Ford Transit Custom"
          labelPosition="bottom"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={195} durationInFrames={75}>
        <PhotoCard
          imageSrc="photos/van-peggy.jpg"
          title="Peggy"
          subtitle="Fiat Ducato L2H2"
          labelPosition="top"
          durationInFrames={75}
        />
      </Sequence>

      <Sequence from={270} durationInFrames={60}>
        <PhotoCard
          imageSrc="photos/mains-atelier.jpg"
          title="Aménagement sur-mesure"
          labelPosition="bottom"
          durationInFrames={60}
          kenBurns={{ from: 1.0, to: 1.03 }}
        />
      </Sequence>

      <Sequence from={330} durationInFrames={90}>
        <PhotoCard
          imageSrc="photos/hero-poster.jpg"
          title="Fait main,"
          subtitle="pour prendre le large."
          labelPosition="bottom"
          durationInFrames={90}
          textStartFrame={15}
          subtitleDelayFrames={30}
          kenBurns={{ from: 1.0, to: 1.0 }}
        />
      </Sequence>

      <Sequence from={420} durationInFrames={90}>
        <LogoCard variant="outro" siteUrl={siteUrl} />
      </Sequence>
    </AbsoluteFill>
  );
}
```

- [ ] **Step 2: Verify types compile**

Run: `pnpm --filter video exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Verify @remotion/google-fonts/Geist resolves**

Run: `node -e "console.log(require.resolve('@remotion/google-fonts/Geist'))"`
Expected: a resolved path. If it errors with "Cannot find module '@remotion/google-fonts/Geist'", apply the fallback below.

**Fallback (only if Geist subpath does not exist):** Replace the `loadFont` line with this manual loader:

```tsx
import { delayRender, continueRender, staticFile } from "remotion";
import { useEffect, useState } from "react";

function useGeistFont() {
  const [handle] = useState(() => delayRender("Geist font"));
  useEffect(() => {
    Promise.all([
      new FontFace("Geist", `url(https://fonts.gstatic.com/s/geist/v1/Geist-Regular.woff2) format('woff2')`, { weight: "400" }).load(),
      new FontFace("Geist", `url(https://fonts.gstatic.com/s/geist/v1/Geist-Medium.woff2) format('woff2')`, { weight: "500" }).load(),
      new FontFace("Geist", `url(https://fonts.gstatic.com/s/geist/v1/Geist-SemiBold.woff2) format('woff2')`, { weight: "600" }).load(),
    ]).then((fonts) => {
      fonts.forEach((f) => document.fonts.add(f));
      continueRender(handle);
    });
  }, [handle]);
}
```

Then call `useGeistFont()` at the top of the `LaunchAnnouncement` component body. Note the URLs may rotate — if 404, swap to the URLs Google Fonts CSS returns (open `https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700` in a browser to see them).

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/compositions/LaunchAnnouncement/
git commit -m "feat(video): build LaunchAnnouncement composition (17s, 9:16)"
```

---

## Task 7: Register the composition in Root.tsx

**Files:**
- Modify: `apps/video/src/Root.tsx`

- [ ] **Step 1: Read the current Root.tsx**

Run: `cat apps/video/src/Root.tsx`
Expected: shows the existing QuoteCard registration only.

- [ ] **Step 2: Replace the file with the updated version**

File: `apps/video/src/Root.tsx`

```tsx
import { Composition } from "remotion";
import { QuoteCard, quoteCardSchema } from "./compositions/QuoteCard";
import {
  LaunchAnnouncement,
  launchAnnouncementSchema,
} from "./compositions/LaunchAnnouncement";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="QuoteCard"
        component={QuoteCard as any}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        schema={quoteCardSchema}
        defaultProps={{
          author: "Marion H.",
          city: "Bordeaux",
          stars: 5,
          quote:
            "Quatre jours à Zarautz avec Marceau. Pas un défaut. On revient l'été prochain.",
          vanId: "marceau" as const,
        }}
      />

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
    </>
  );
};
```

- [ ] **Step 3: Verify types compile**

Run: `pnpm --filter video exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add apps/video/src/Root.tsx
git commit -m "feat(video): register LaunchAnnouncement composition in Root"
```

---

## Task 8: Add render script and capture preview frames

**Files:**
- Modify: `apps/video/package.json`

- [ ] **Step 1: Read current package.json scripts**

Run: `cat apps/video/package.json | grep -A 10 '"scripts"'`
Expected: shows `studio`, `render:quote`, `render:dispo`, `render:vantour`, `upgrade`.

- [ ] **Step 2: Add the render:launch script**

Replace the `"scripts"` block in `apps/video/package.json` with:

```json
"scripts": {
  "studio": "remotion studio",
  "render:quote": "remotion render QuoteCard",
  "render:dispo": "remotion render DispoCard",
  "render:vantour": "remotion render VanTour",
  "render:launch": "remotion render LaunchAnnouncement out/launch-9x16.mp4 --codec h264 --crf 18",
  "upgrade": "remotion upgrade"
}
```

- [ ] **Step 3: Capture preview stills at key frames to verify visuals**

```bash
mkdir -p apps/video/out/previews
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/01-intro.jpg --frame=22
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/02-atelier.jpg --frame=80
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/03-penelope.jpg --frame=155
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/04-peggy.jpg --frame=230
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/05-surmesure.jpg --frame=300
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/06-tagline.jpg --frame=400
pnpm --filter video exec remotion still LaunchAnnouncement out/previews/07-outro.jpg --frame=480
```

Expected: 7 JPEG files in `apps/video/out/previews/`. Open them and check :

- 01: logo centred on cream background
- 02: atelier photo with `Atelier RB-CapSO` / `Capbreton, Landes` at the bottom
- 03: van photo with `Pénélope` / `Ford Transit Custom`
- 04: van photo with `Peggy` / `Fiat Ducato L2H2` at the top
- 05: hands working with `Aménagement sur-mesure`
- 06: drone falaise with two-line tagline
- 07: cream background with logo top, `Le site est en ligne` middle, `rb-capso.fr` bottom

If any frame has missing fonts, broken images, or layout issues, fix the relevant component before proceeding.

- [ ] **Step 4: Render the full video**

```bash
pnpm --filter video render:launch
```

Expected: `apps/video/out/launch-9x16.mp4` is produced. Duration: ~17 s. Size: 1.5–3 MB.

Run: `ls -lh apps/video/out/launch-9x16.mp4 && ffprobe -v quiet -show_entries format=duration apps/video/out/launch-9x16.mp4`
Expected: file size 1.5–3 MB, duration ≈ 17.000000.

- [ ] **Step 5: Add `out/` to gitignore so we do not commit binaries**

Run: `grep -q "^apps/video/out/" .gitignore || echo "apps/video/out/" >> .gitignore`

If the project uses a per-app `.gitignore` instead, append `out/` to `apps/video/.gitignore`.

- [ ] **Step 6: Commit**

```bash
git add apps/video/package.json .gitignore
git commit -m "feat(video): add render:launch script and gitignore output"
```

---

## Task 9: Save the message for Romain to PROMPTS.md

**Files:**
- Modify: `tasks/PROMPTS.md`

- [ ] **Step 1: Append the announcement message**

Append the following block to `/Users/antoninmarcon/Documents/Projects/RB CAPSO/tasks/PROMPTS.md`:

```markdown

## Annonce mise en ligne du site (à envoyer à Romain)

Pièce jointe : `code/apps/video/out/launch-9x16.mp4` (17 s, 9:16, ~2 Mo).

```
Bonjour Romain,

Voici le site finalisé : https://rb-capso.vercel.app

Et une courte vidéo d'annonce (17 secondes, format vertical) que vous pouvez poster sur le compte @Rb.capso ou envoyer aux clients qui demandent le lien.

Prenez le temps de tout regarder, et envoyez-moi vos retours avant qu'on bascule le nom de domaine sur rb-capso.fr.

Bonne soirée.
```
```

- [ ] **Step 2: Verify the file was updated**

Run: `tail -25 tasks/PROMPTS.md`
Expected: shows the new "Annonce mise en ligne du site" section.

- [ ] **Step 3: Commit**

The `tasks/` directory lives at the project root, outside the `code/` git repo. This file does not get committed via `git`. Instead, the change is persistent in the local filesystem and will be re-read next session.

If you have set up a separate git repo at the project root for `tasks/`, run:

```bash
cd ../  # to project root
git add tasks/PROMPTS.md
git commit -m "docs(prompts): add launch announcement message for Romain"
```

Otherwise, skip the commit step.

---

## Self-Review Checklist (run after all tasks complete)

- [ ] **Spec coverage:** every section of the spec maps to a task
  - §3.1 file structure → Tasks 1, 3-7
  - §3.2 schema → Task 6
  - §3.3 metadata → Task 7
  - §3.4 design tokens → Tasks 4, 5, 6 (use `colors` from theme; Geist hardcoded as Geist)
  - §4 storyboard → Task 6 (timing) + verified visually in Task 8
  - §5 components → Tasks 4, 5
  - §6 fonts → Task 6 (loadFont + fallback)
  - §7 assets → Task 1
  - §8 render → Task 8
  - §9 message → Task 9
  - §12 success criteria → Task 8 (render + size + duration check)

- [ ] **Visual verification:** Task 8 captures 7 stills and runs full render. Open the MP4 in QuickTime or VLC and confirm:
  - 17 seconds total
  - All 7 cards appear in order
  - Cuts are franc (no fade-to-black)
  - Logo + URL legible at end
  - Test playback on iOS (Story Insta upload preview) and WhatsApp Web before declaring done

- [ ] **Brand grammar respected:**
  - No fade-to-black between cards (cuts via `<Sequence>`) ✓
  - No glitch / whoosh / drop-shadow ✓
  - Vouvoiement and no emoji in message ✓
  - URL in `colors.wood` for accent ✓

---

## Notes for the executor

- If `pnpm --filter video exec tsc --noEmit` fails on a workspace path issue, run from the `apps/video/` directory directly: `cd apps/video && pnpm exec tsc --noEmit`.
- `remotion still` is fast (~1 s per frame). Use it liberally for visual debugging instead of full renders.
- If a font does not load in studio but loads at render time (or vice versa), check both `pnpm --filter video studio` and `pnpm --filter video render:launch`. Studio uses dev mode; render uses production bundling. They can diverge.
- The QuoteCard composition currently uses old van names "Marceau"/"Lazare" (legacy). Updating that to "Pénélope"/"Peggy" is **out of scope** for this plan and tracked separately.
