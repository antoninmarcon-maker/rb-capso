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
