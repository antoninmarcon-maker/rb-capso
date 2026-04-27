import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../../../theme";
import { fadeInSpring } from "../animations";

// Geist hardcoded: design-tokens fonts.body still references legacy Söhne stack.
// See spec docs/superpowers/specs/2026-04-27-launch-announcement-video-design.md §3.4.
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
