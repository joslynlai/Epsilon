/**
 * UIOverlay.tsx
 *
 * HTML UI layer floating above the WebGL canvas.
 * pointer-events-none on the container; pointer-events-auto on interactive bits.
 *
 * Renders different content based on AppPhase + transitionComplete:
 *   idle                → input form (centered)
 *   loading             → spinner
 *   visualizing (lerp)  → "Reshaping..." label
 *   visualizing (done)  → narrative readout + reset button
 */

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useEpsilonStore } from "../store/epsilonStore"
import { rgbToHex, STATUS_QUO_COLOR, COMPARISON_STATUS_QUO_COLOR } from "../utils/colorMapping"
import { STATUS_QUO_PARAMS } from "../utils/lorenzMath"

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
}

export default function UIOverlay() {
  const phase = useEpsilonStore((s) => s.phase)
  const mode = useEpsilonStore((s) => s.mode)
  const inputA = useEpsilonStore((s) => s.inputA)
  const inputB = useEpsilonStore((s) => s.inputB)
  const setInputA = useEpsilonStore((s) => s.setInputA)
  const setInputB = useEpsilonStore((s) => s.setInputB)
  const submit = useEpsilonStore((s) => s.submit)
  const reset = useEpsilonStore((s) => s.reset)
  const attractors = useEpsilonStore((s) => s.attractors)
  const transitionComplete = useEpsilonStore((s) => s.transitionComplete)

  const [showSecondInput, setShowSecondInput] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputA.trim()) submit()
  }

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col">
      {/* Header */}
      <header className="p-6 pointer-events-auto">
        <motion.h1
          className="text-sm tracking-[0.35em] uppercase font-light"
          style={{ color: "rgba(255,255,255,0.35)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Epsilon
        </motion.h1>
      </header>

      {/* Center content — phase-based */}
      <div className="flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ── IDLE: Input Form ── */}
          {phase === "idle" && (
            <motion.form
              key="form"
              className="pointer-events-auto w-full max-w-lg px-6"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
              onSubmit={handleSubmit}
            >
              <p className="text-white/50 text-sm mb-6 text-center font-light">
                Describe a decision. Watch the shape of your trajectory reshape.
              </p>

              <input
                type="text"
                value={inputA}
                onChange={(e) => setInputA(e.target.value)}
                placeholder="e.g. 'Take the startup job in Berlin'"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors"
              />

              <AnimatePresence>
                {showSecondInput && (
                  <motion.input
                    key="inputB"
                    type="text"
                    value={inputB}
                    onChange={(e) => setInputB(e.target.value)}
                    placeholder="e.g. 'Stay and grow at the current company'"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-white/30 transition-colors mt-3"
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.25 }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center gap-3 mt-5">
                <button
                  type="submit"
                  disabled={!inputA.trim()}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-sm transition-all cursor-pointer"
                >
                  Visualize
                </button>

                <button
                  type="button"
                  onClick={() => setShowSecondInput(!showSecondInput)}
                  className="px-4 py-2.5 text-white/40 hover:text-white/70 text-sm transition-colors cursor-pointer"
                >
                  {showSecondInput ? "- Single mode" : "+ Compare two paths"}
                </button>
              </div>
            </motion.form>
          )}

          {/* ── LOADING ── */}
          {phase === "loading" && (
            <motion.div
              key="loading"
              className="text-center"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-white/40 text-xs tracking-widest uppercase">
                Analyzing semantic space…
              </p>
            </motion.div>
          )}

          {/* ── VISUALIZING: Transition in progress ── */}
          {phase === "visualizing" && !transitionComplete && (
            <motion.div
              key="transitioning"
              className="fixed bottom-8 left-8"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <p className="text-white/30 text-xs tracking-widest uppercase">
                Reshaping phase space…
              </p>
            </motion.div>
          )}

          {/* ── VISUALIZING: Transition complete — readout + reset ── */}
          {phase === "visualizing" && transitionComplete && (
            <motion.div
              key="complete"
              className="pointer-events-auto fixed bottom-8 left-8 right-8 flex items-end justify-between"
              variants={fadeVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4 }}
            >
              {/* Narrative readout */}
              <div className="space-y-4 max-w-xl">
                {/* Status quo reference */}
                <div className="flex items-center gap-3">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: rgbToHex(mode === "comparison" ? COMPARISON_STATUS_QUO_COLOR : STATUS_QUO_COLOR) }}
                  />
                  <span className="text-white/30 text-xs font-mono">
                    Status Quo · σ={STATUS_QUO_PARAMS.sigma.toFixed(0)}{" "}
                    ρ={STATUS_QUO_PARAMS.rho.toFixed(0)}{" "}
                    β={STATUS_QUO_PARAMS.beta.toFixed(2)}
                  </span>
                </div>

                {/* Choice entries */}
                {attractors.map((a, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: rgbToHex(a.targetColor) }}
                      />
                      <span className="text-white/60 text-xs font-mono">
                        {mode === "comparison" ? `${i === 0 ? "A (Left)" : "B (Right)"}: ` : ""}
                        {a.analysis.label}
                      </span>
                      <span className="text-white/20 text-xs font-mono">
                        σ={a.targetParams.sigma.toFixed(1)}{" "}
                        ρ={a.targetParams.rho.toFixed(1)}{" "}
                        β={a.targetParams.beta.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-white/30 text-xs ml-5 leading-relaxed">
                      {a.analysis.narrative}
                    </p>
                  </div>
                ))}
              </div>

              {/* Reset */}
              <button
                onClick={reset}
                className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-lg text-white text-sm transition-all cursor-pointer flex-shrink-0"
              >
                New Decision
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
