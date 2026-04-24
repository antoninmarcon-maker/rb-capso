import { ImageResponse } from "next/og";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

const COLORS = {
  cream: "#EFE8DC",
  ink: "#1E2A24",
  sage: "#8AA18A",
  wood: "#C6A36B",
};

/**
 * Dynamic Open Graph image — /api/og?title=...&subtitle=...&eyebrow=...
 * Example: /api/og?title=Pénélope&eyebrow=Van&subtitle=Ford%20Transit%20Custom
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const title = url.searchParams.get("title") ?? "Fait main, pour prendre le large.";
  const subtitle =
    url.searchParams.get("subtitle") ??
    "Vans faits main dans les Landes. Location et conception à Capbreton.";
  const eyebrow = url.searchParams.get("eyebrow") ?? "Capbreton, Landes";

  return new ImageResponse(
    (
      <div
        style={{
          width: WIDTH,
          height: HEIGHT,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: COLORS.cream,
          padding: 64,
          fontFamily: "Georgia, serif",
          color: COLORS.ink,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative gradient stripe */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 12,
            background: `linear-gradient(90deg, ${COLORS.sage}, ${COLORS.wood}, ${COLORS.sage})`,
            display: "flex",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: COLORS.sage,
              fontWeight: 500,
              display: "flex",
            }}
          >
            {eyebrow}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: -1.5,
              maxWidth: 1000,
              display: "flex",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              lineHeight: 1.4,
              color: `${COLORS.ink}CC`,
              maxWidth: 900,
              fontFamily: "sans-serif",
              display: "flex",
            }}
          >
            {subtitle}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: `1px solid ${COLORS.ink}1A`,
            paddingTop: 24,
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              fontSize: 28,
              fontWeight: 600,
              letterSpacing: 1,
              display: "flex",
            }}
          >
            RB-CapSO
          </div>
          <div style={{ fontSize: 22, color: `${COLORS.ink}99`, display: "flex" }}>
            rb-capso.fr
          </div>
        </div>
      </div>
    ),
    { width: WIDTH, height: HEIGHT }
  );
}
