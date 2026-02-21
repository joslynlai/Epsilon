/**
 * mockAgent.ts
 *
 * Simulates LLM semantic analysis of a user's decision text.
 * Returns volatility / focus / momentum scores (0-100) plus a narrative.
 *
 * Designed to be swappable with a real OpenAI / Anthropic API call later —
 * just replace the implementation and keep the same return type.
 */

export interface SemanticAnalysis {
  volatility: number   // 0-100: how unpredictable / chaotic the decision is
  focus: number        // 0-100: how directed / concentrated the path is
  momentum: number     // 0-100: how much forward energy / inertia it carries
  label: string        // short descriptor (e.g. "Career Leap")
  narrative: string    // 1-sentence interpretation
}

/** Deterministic-ish hash from a string to seed "unique" but reproducible scores */
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash + char) | 0
  }
  return Math.abs(hash)
}

/** Map a hash seed to a score in [20, 90] so nothing is at the extremes */
function seedToScore(seed: number, offset: number): number {
  return 20 + ((seed * (offset + 7)) % 71)
}

function generateLabel(volatility: number, focus: number): string {
  if (volatility > 65 && focus > 65) return "Ambitious Gambit"
  if (volatility > 65 && focus <= 65) return "Wild Card"
  if (volatility <= 35 && focus > 65) return "Steady Course"
  if (volatility <= 35 && focus <= 35) return "Quiet Drift"
  if (focus > 65) return "Laser Focus"
  if (volatility > 65) return "Volatile Leap"
  return "Balanced Path"
}

function generateNarrative(
  input: string,
  volatility: number,
  focus: number,
  momentum: number
): string {
  const intensity =
    volatility > 60 ? "turbulent" : volatility > 35 ? "dynamic" : "stable"
  const direction =
    focus > 60 ? "with clear direction" : focus > 35 ? "with moderate clarity" : "drifting freely"
  const energy =
    momentum > 60 ? "strong forward momentum" : momentum > 35 ? "moderate inertia" : "gentle pace"

  return `This path feels ${intensity}, ${direction}, carrying ${energy} — "${input.slice(0, 40)}${input.length > 40 ? "..." : ""}".`
}

/**
 * Analyze one or two decision inputs.
 * Returns an array of SemanticAnalysis objects (1 or 2 depending on input).
 * Simulates ~800ms network latency.
 */
export async function mockLLMAnalysis(
  inputs: string[]
): Promise<SemanticAnalysis[]> {
  // Simulate realistic API latency
  await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400))

  return inputs.map((input, idx) => {
    const seed = hashString(input.trim().toLowerCase())
    const volatility = seedToScore(seed, 3 + idx * 11)
    const focus = seedToScore(seed, 7 + idx * 13)
    const momentum = seedToScore(seed, 11 + idx * 17)

    return {
      volatility,
      focus,
      momentum,
      label: generateLabel(volatility, focus),
      narrative: generateNarrative(input, volatility, focus, momentum),
    }
  })
}

