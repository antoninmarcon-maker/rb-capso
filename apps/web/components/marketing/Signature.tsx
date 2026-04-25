interface Props {
  className?: string;
  color?: string;
  width?: number;
}

/**
 * Hand-drawn signature for Romain. Pure SVG path so it can be animated and
 * scales without any font dependency. The path approximates a continuous
 * pen stroke "Romain" with the loop on the M.
 */
export function Signature({ className, color = "currentColor", width = 220 }: Props) {
  return (
    <svg
      viewBox="0 0 220 60"
      width={width}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Signature de Romain"
    >
      <path
        d="M2 38 C 2 22, 12 12, 22 18 C 30 22, 28 38, 18 36 C 14 35, 14 30, 18 28 C 26 25, 36 35, 38 42 M 36 36 C 38 28, 46 22, 50 30 C 52 36, 50 42, 46 42 C 50 38, 56 32, 62 32 C 66 32, 66 38, 64 42 M 66 38 C 70 30, 78 18, 80 36 M 80 36 C 86 28, 92 28, 94 38 C 100 32, 106 28, 108 38 M 108 38 C 112 22, 122 14, 130 18 C 140 22, 138 40, 124 38 C 116 36, 118 30, 124 28 M 130 36 C 138 32, 148 36, 152 42"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M 158 26 L 162 22 M 156 30 C 160 30, 164 32, 168 38"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
