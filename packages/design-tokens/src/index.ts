export const colors = {
  cream: "#EFE8DC",
  ink: "#1E2A24",
  sage: "#8AA18A",
  wood: "#C6A36B",
  ocean: "#365A6B",
} as const;

export const fonts = {
  display: "GT Sectra, Canela, Fraunces, Georgia, serif",
  body: "Söhne, Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 48,
  xxl: 64,
  xxxl: 96,
} as const;

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1440,
} as const;

export type Colors = typeof colors;
export type Fonts = typeof fonts;
