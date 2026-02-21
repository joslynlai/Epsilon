/**
 * epsilonStore.ts
 *
 * Zustand store — single source of truth for the entire app.
 * Phases: idle → loading → visualizing
 *
 * In the "visualizing" phase, the Lorenz attractor starts at
 * STATUS_QUO_PARAMS and smoothly transitions (lerps) to the
 * user's choice parameters, showing a phase transition.
 */

import { create } from "zustand"
import type { SemanticAnalysis } from "../utils/mockAgent"
import type { LorenzParams } from "../utils/lorenzMath"
import type { RGBColor } from "../utils/colorMapping"
import { mockLLMAnalysis } from "../utils/mockAgent"
import { scoresToParams } from "../utils/lorenzMath"
import { volatilityToColor, getComparisonColor } from "../utils/colorMapping"

export type AppPhase = "idle" | "loading" | "visualizing"
export type AppMode = "single" | "comparison"

export interface AttractorData {
  targetParams: LorenzParams
  targetColor: RGBColor
  analysis: SemanticAnalysis
}

interface EpsilonState {
  phase: AppPhase
  mode: AppMode

  // User inputs
  inputA: string
  inputB: string

  // Computed attractor data (1 or 2 entries)
  attractors: AttractorData[]

  // True once the param lerp animation has finished
  transitionComplete: boolean

  // Actions
  setInputA: (v: string) => void
  setInputB: (v: string) => void
  submit: () => Promise<void>
  onTransitionComplete: () => void
  reset: () => void
}

export const useEpsilonStore = create<EpsilonState>((set, get) => ({
  phase: "idle",
  mode: "single",
  inputA: "",
  inputB: "",
  attractors: [],
  transitionComplete: false,

  setInputA: (v) => set({ inputA: v }),
  setInputB: (v) => set({ inputB: v }),

  submit: async () => {
    const { inputA, inputB } = get()
    const inputs = inputB.trim() ? [inputA.trim(), inputB.trim()] : [inputA.trim()]
    if (inputs[0].length === 0) return

    const mode: AppMode = inputs.length === 2 ? "comparison" : "single"
    set({ phase: "loading", mode, transitionComplete: false })

    try {
      const analyses = await mockLLMAnalysis(inputs)
      const attractors: AttractorData[] = analyses.map((analysis, i) => ({
        targetParams: scoresToParams(analysis),
        targetColor: mode === "comparison"
          ? getComparisonColor(i, analysis.volatility)
          : volatilityToColor(analysis.volatility),
        analysis,
      }))
      set({ phase: "visualizing", attractors })
    } catch {
      set({ phase: "idle", attractors: [] })
    }
  },

  onTransitionComplete: () => {
    set({ transitionComplete: true })
  },

  reset: () => {
    set({
      phase: "idle",
      mode: "single",
      inputA: "",
      inputB: "",
      attractors: [],
      transitionComplete: false,
    })
  },
}))
