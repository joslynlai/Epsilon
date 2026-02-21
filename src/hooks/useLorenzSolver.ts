/**
 * useLorenzSolver.ts
 *
 * Phase-transition Lorenz simulation hook.
 *
 * Renders a single continuous trail that starts in the "status quo" regime
 * (ρ=24, just below the Hopf bifurcation) and smoothly transitions to the
 * user's choice parameters (ρ>26, chaotic). The transition creates a
 * dramatic visual: calm quasi-periodic oscillations erupting into full
 * chaotic butterfly behavior as the attractor's topology is reshaped.
 *
 * Color shifts dynamically — each emitted point is stamped with the
 * lerped color at the time of emission, creating a gradient from cool
 * cyan (status quo) to warm neon (the choice) along the trail.
 *
 * Architecture:
 *   - Ring buffers for raw position/color writes (no per-step shifting)
 *   - Display buffers for contiguous draw upload each frame
 *   - Display color = raw color × brightness LUT
 *   - Two BufferGeometry refs (line + points) share the same attributes
 */

import { useRef, useEffect } from "react"
import * as THREE from "three"
import { useFrame } from "@react-three/fiber"
import {
  STATUS_QUO_PARAMS,
  DEFAULT_INITIAL,
  DT,
  rk4Step,
  lerpParams,
  type LorenzParams,
  type Vec3,
} from "../utils/lorenzMath"
import {
  STATUS_QUO_COLOR,
  lerpColor,
  type RGBColor,
} from "../utils/colorMapping"

// ── Configuration ────────────────────────────────────────────────────────────

/** Visible trail points — captures several full orbits of the attractor */
export const TRAIL_LENGTH = 4000

/** RK4 substeps per animation frame — controls simulation speed */
const STEPS_PER_FRAME = 8

/** Used to keep simulation pacing stable across frame rates */
const REFERENCE_FRAME_SECONDS = 1 / 60

/** Seconds of status-quo behavior before transition begins */
const WARMUP_SECONDS = 1.5

/** Seconds for linear parameter/color lerp */
const TRANSITION_SECONDS = 5.0

/** Seconds after transition ends before calling onTransitionComplete */
const SETTLE_SECONDS = 1.0

/** Time at which onTransitionComplete fires */
const COMPLETE_SECONDS = WARMUP_SECONDS + TRANSITION_SECONDS + SETTLE_SECONDS

// ── Pre-compute brightness LUT (tail dim → head bright) ─────────────────────
const brightnessLUT = new Float32Array(TRAIL_LENGTH)
for (let i = 0; i < TRAIL_LENGTH; i++) {
  const t = i / (TRAIL_LENGTH - 1)
  brightnessLUT[i] = 0.02 + 0.98 * (t * t) // quadratic ease-in
}

// ── Hook ─────────────────────────────────────────────────────────────────────

interface UsePhaseLorenzOptions {
  /** The target parameters (from LLM analysis) */
  targetParams: LorenzParams
  /** The target neon color (from volatility mapping) */
  targetColor: RGBColor
  /** Starting trail color (defaults to STATUS_QUO_COLOR) */
  startColor?: RGBColor
  /** Whether the simulation is running */
  active: boolean
  /** Called when the transition animation is complete */
  onTransitionComplete?: () => void
}

export interface PhaseLorenzResult {
  lineGeoRef: React.RefObject<THREE.BufferGeometry | null>
  pointsGeoRef: React.RefObject<THREE.BufferGeometry | null>
}

export function usePhaseLorenz({
  targetParams,
  targetColor,
  startColor = STATUS_QUO_COLOR,
  active,
  onTransitionComplete,
}: UsePhaseLorenzOptions): PhaseLorenzResult {
  const lineGeoRef = useRef<THREE.BufferGeometry>(null)
  const pointsGeoRef = useRef<THREE.BufferGeometry>(null)

  // Simulation state — all in refs to avoid re-renders
  const pos = useRef<Vec3>({ ...DEFAULT_INITIAL })
  const elapsedSeconds = useRef(0)
  const rawColorBuf = useRef(new Float32Array(TRAIL_LENGTH * 3))
  const rawPosBuf = useRef(new Float32Array(TRAIL_LENGTH * 3))
  const displayPosBuf = useRef(new Float32Array(TRAIL_LENGTH * 3))
  const displayColorBuf = useRef(new Float32Array(TRAIL_LENGTH * 3))
  const visibleCount = useRef(0)
  const writeIndex = useRef(0)
  const hasCalledComplete = useRef(false)

  // Shared BufferAttribute refs (same instance used by both geometries)
  const posAttrRef = useRef(new THREE.BufferAttribute(displayPosBuf.current, 3))
  const colAttrRef = useRef(new THREE.BufferAttribute(displayColorBuf.current, 3))
  posAttrRef.current.setUsage(THREE.DynamicDrawUsage)
  colAttrRef.current.setUsage(THREE.DynamicDrawUsage)

  // Stable refs for latest prop values (avoids stale closures in useFrame)
  const onCompleteRef = useRef(onTransitionComplete)
  onCompleteRef.current = onTransitionComplete
  const targetParamsRef = useRef(targetParams)
  const targetColorRef = useRef(targetColor)
  const startColorRef = useRef(startColor)
  targetParamsRef.current = targetParams
  targetColorRef.current = targetColor
  startColorRef.current = startColor

  // ── Setup / reset geometries when target changes ──────────────────────────
  useEffect(() => {
    // Reset simulation state
    pos.current = { ...DEFAULT_INITIAL }
    elapsedSeconds.current = 0
    rawColorBuf.current.fill(0)
    rawPosBuf.current.fill(0)
    displayPosBuf.current.fill(0)
    displayColorBuf.current.fill(0)
    visibleCount.current = 0
    writeIndex.current = 0
    hasCalledComplete.current = false

    const posAttr = posAttrRef.current
    const colAttr = colAttrRef.current

    // Attach to both geometries (shared GPU buffer)
    const lineGeo = lineGeoRef.current
    if (lineGeo) {
      lineGeo.setAttribute("position", posAttr)
      lineGeo.setAttribute("color", colAttr)
      lineGeo.setDrawRange(0, 0)
    }
    const pointsGeo = pointsGeoRef.current
    if (pointsGeo) {
      pointsGeo.setAttribute("position", posAttr)
      pointsGeo.setAttribute("color", colAttr)
      pointsGeo.setDrawRange(0, 0)
    }
  }, [targetParams, targetColor, startColor])

  // ── Real-time animation loop ──────────────────────────────────────────────
  useFrame((_, delta) => {
    if (!active) return

    const posAttr = posAttrRef.current
    const colAttr = colAttrRef.current
    if (!posAttr || !colAttr) return

    const rpBuf = rawPosBuf.current
    const rBuf = rawColorBuf.current
    const dpBuf = displayPosBuf.current
    const dBuf = displayColorBuf.current
    const target = targetParamsRef.current
    const targetCol = targetColorRef.current

    elapsedSeconds.current += delta
    const elapsed = elapsedSeconds.current

    // Compute linear lerp progress in seconds
    let lerpT = 0
    if (elapsed > WARMUP_SECONDS) {
      lerpT = Math.min((elapsed - WARMUP_SECONDS) / TRANSITION_SECONDS, 1)
    }

    // Current interpolated parameters and color
    const currentParams = lerpParams(STATUS_QUO_PARAMS, target, lerpT)
    const currentColor = lerpColor(startColorRef.current, targetCol, lerpT)

    // Scale substeps by delta to keep simulation speed more frame-rate stable.
    const scaledSteps = Math.round((delta / REFERENCE_FRAME_SECONDS) * STEPS_PER_FRAME)
    const substeps = Math.max(1, Math.min(scaledSteps, STEPS_PER_FRAME * 4))

    // Write into ring buffers (avoids full-array shifts per substep).
    for (let step = 0; step < substeps; step++) {
      pos.current = rk4Step(pos.current, currentParams, DT)

      const idx = writeIndex.current
      const base = idx * 3
      rpBuf[base] = pos.current.x
      rpBuf[base + 1] = pos.current.y
      rpBuf[base + 2] = pos.current.z

      rBuf[base] = currentColor.r
      rBuf[base + 1] = currentColor.g
      rBuf[base + 2] = currentColor.b

      writeIndex.current = (idx + 1) % TRAIL_LENGTH
      if (visibleCount.current < TRAIL_LENGTH) {
        visibleCount.current += 1
      }
    }

    const visible = visibleCount.current
    if (visible === 0) return

    // Rebuild contiguous draw buffers from the ring window (oldest → newest).
    const oldestIndex = visible === TRAIL_LENGTH ? writeIndex.current : 0
    const brightnessOffset = TRAIL_LENGTH - visible
    for (let i = 0; i < visible; i++) {
      const src = ((oldestIndex + i) % TRAIL_LENGTH) * 3
      const dst = i * 3

      dpBuf[dst] = rpBuf[src]
      dpBuf[dst + 1] = rpBuf[src + 1]
      dpBuf[dst + 2] = rpBuf[src + 2]

      const b = brightnessLUT[brightnessOffset + i]
      dBuf[dst] = rBuf[src] * b
      dBuf[dst + 1] = rBuf[src + 1] * b
      dBuf[dst + 2] = rBuf[src + 2] * b
    }

    // Upload to GPU — both geometries share these attributes
    posAttr.needsUpdate = true
    colAttr.needsUpdate = true
    lineGeoRef.current?.setDrawRange(0, visible)
    pointsGeoRef.current?.setDrawRange(0, visible)

    // Fire completion callback
    if (!hasCalledComplete.current && elapsed >= COMPLETE_SECONDS) {
      hasCalledComplete.current = true
      onCompleteRef.current?.()
    }
  })

  return { lineGeoRef, pointsGeoRef }
}
