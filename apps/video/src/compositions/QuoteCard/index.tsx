import { z } from "zod";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { colors, fonts } from "../../theme";

export const quoteCardSchema = z.object({
  author: z.string(),
  city: z.string(),
  stars: z.number().int().min(1).max(5),
  quote: z.string().max(220),
  vanId: z.enum(["marceau", "lazare"]),
});

export type QuoteCardProps = z.infer<typeof quoteCardSchema>;

export function QuoteCard({ author, city, stars, quote, vanId }: QuoteCardProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const quoteOpacity = spring({ frame: frame - 20, fps, from: 0, to: 1, durationInFrames: 24 });
  const authorOpacity = spring({ frame: frame - 60, fps, from: 0, to: 1, durationInFrames: 24 });
  const starsOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateRight: "clamp",
  });

  const outroStart = durationInFrames - 30;
  const outroOpacity = interpolate(frame, [outroStart, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.cream,
        fontFamily: fonts.body,
        opacity: outroOpacity,
      }}
    >
      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 180,
          background: `linear-gradient(180deg, ${colors.sage}40, transparent)`,
        }}
      />

      <AbsoluteFill
        style={{
          padding: "140px 80px",
          justifyContent: "space-between",
        }}
      >
        <div>
          <span
            style={{
              fontFamily: fonts.display,
              fontSize: 36,
              color: colors.sage,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            RB-CapSO
          </span>

          <div style={{ marginTop: 40, opacity: starsOpacity }}>
            <StarRow stars={stars} />
          </div>

          <blockquote
            style={{
              fontFamily: fonts.display,
              fontSize: 74,
              fontWeight: 500,
              color: colors.ink,
              lineHeight: 1.2,
              marginTop: 50,
              opacity: quoteOpacity,
              letterSpacing: -1,
            }}
          >
            « {quote} »
          </blockquote>
        </div>

        <div style={{ opacity: authorOpacity }}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 34,
              color: colors.ink,
              fontWeight: 600,
            }}
          >
            {author}
          </div>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 28,
              color: `${colors.ink}99`,
              marginTop: 6,
            }}
          >
            {city} — {vanId === "marceau" ? "Marceau" : "Lazare"}
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

function StarRow({ stars }: { stars: number }) {
  return (
    <div style={{ display: "flex", gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          width={48}
          height={48}
          viewBox="0 0 24 24"
          fill={i < stars ? colors.wood : "transparent"}
          stroke={colors.wood}
          strokeWidth={1.5}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}
