// Neon color palette for detection overlays
const NEON_PALETTE = [
  '#6366f1', // indigo
  '#06b6d4', // cyan
  '#d946ef', // magenta
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#f97316', // orange
  '#ec4899', // pink
  '#3b82f6', // blue
  '#84cc16', // lime
  '#a855f7', // purple
  '#0ea5e9', // sky
  '#e11d48', // rose
  '#10b981', // emerald
].map(hexToRgba);

function hexToRgba(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    1.0,
  ];
}

const colorCache = {};

export function getNeonColor(classIdx, alpha = 1.0) {
  const key = `${classIdx}-${alpha}`;
  if (colorCache[key]) return colorCache[key];

  const base = NEON_PALETTE[classIdx % NEON_PALETTE.length];
  const result = [base[0], base[1], base[2], alpha];
  colorCache[key] = result;
  return result;
}

export function getNeonColorCSS(classIdx, alpha = 1.0) {
  const c = getNeonColor(classIdx, alpha);
  return `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${c[3]})`;
}

// Turbo colormap LUT for depth visualization
export const TURBO_LUT = new Uint8Array(256 * 3);
for (let i = 0; i < 256; i++) {
  const t = i / 255;
  const x2 = t * t, x3 = x2 * t, x4 = x2 * x2, x5 = x4 * t;
  TURBO_LUT[i * 3]     = Math.max(0, Math.min(255, Math.round((0.13572138 + 4.61539260 * t - 42.66032258 * x2 + 132.13108234 * x3 - 152.94239396 * x4 + 59.28637943 * x5) * 255)));
  TURBO_LUT[i * 3 + 1] = Math.max(0, Math.min(255, Math.round((0.09140261 + 2.19418839 * t + 4.84296658 * x2 - 14.18503333 * x3 + 7.68297740 * x4 + 0.22168465 * x5) * 255)));
  TURBO_LUT[i * 3 + 2] = Math.max(0, Math.min(255, Math.round((0.10667330 + 12.64194608 * t - 60.58204836 * x2 + 110.36276771 * x3 - 89.90310912 * x4 + 27.34824973 * x5) * 255)));
}
