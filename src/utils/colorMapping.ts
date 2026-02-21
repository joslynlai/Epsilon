/**
 * colorMapping.ts
 *
 * Neon color palette for the Epsilon visualization.
 *
 * Status Quo:   Electric Cyan — calm, stable
 * Choices:      Neon warm spectrum — violet → magenta → pink → orange
 *
 * During the phase transition, colors lerp from STATUS_QUO_COLOR
 * to the choice's volatility color, creating a gradient along
 * the trail as the attractor morphs.
 */

export interface RGBColor {
  r: number
  g: number
  b: number
}

// ── Status Quo Color ─────────────────────────────────────────────────────────
/** Electric cyan for the stable "comfort zone" state */
export const STATUS_QUO_COLOR: RGBColor = { r: 0.0, g: 0.9, b: 1.0 }

// ── Choice palette anchors (warm neon spectrum) ─────────────────────────────
const NEON_VIOLET: RGBColor  = { r: 0.55, g: 0.0,  b: 1.0  } // #8c00ff
const NEON_MAGENTA: RGBColor = { r: 1.0,  g: 0.0,  b: 0.85 } // #ff00d9
const NEON_PINK: RGBColor    = { r: 1.0,  g: 0.1,  b: 0.45 } // #ff1a73
const NEON_ORANGE: RGBColor  = { r: 1.0,  g: 0.45, b: 0.0  } // #ff7200

/** Linearly interpolate between two colors */
export function lerpColor(a: RGBColor, b: RGBColor, t: number): RGBColor {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  }
}

/**
 * Volatility (0-100) → neon warm RGB color.
 *
 *   0–33:  Violet → Magenta   (contained, purposeful)
 *  33–66:  Magenta → Pink     (energetic, uncertain)
 *  66–100: Pink → Orange      (explosive, chaotic)
 *
 * Always warm — always contrasts with the cyan status-quo.
 */
export function volatilityToColor(volatility: number): RGBColor {
  const v = Math.max(0, Math.min(100, volatility))

  if (v <= 33) {
    return lerpColor(NEON_VIOLET, NEON_MAGENTA, v / 33)
  } else if (v <= 66) {
    return lerpColor(NEON_MAGENTA, NEON_PINK, (v - 33) / 33)
  } else {
    return lerpColor(NEON_PINK, NEON_ORANGE, (v - 66) / 34)
  }
}

/** Convert RGB (0-1) to CSS hex string */
export function rgbToHex(color: RGBColor): string {
  const r = Math.round(color.r * 255).toString(16).padStart(2, "0")
  const g = Math.round(color.g * 255).toString(16).padStart(2, "0")
  const b = Math.round(color.b * 255).toString(16).padStart(2, "0")
  return `#${r}${g}${b}`
}
