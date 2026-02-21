/**
 * LorenzSystem.tsx
 *
 * Renders a single Lorenz attractor as a phase-transitioning trail.
 *
 * Two render layers share the same geometry data:
 *   1. <line>   — structural continuity (native 1px line)
 *   2. <points> — glow volume (bloom makes each point a soft orb)
 *
 * The hook inside handles the status-quo → choice parameter lerp,
 * the real-time RK4 simulation, and the dynamic color gradient.
 */

import { useMemo } from "react"
import * as THREE from "three"
import { usePhaseLorenz } from "../hooks/useLorenzSolver"
import type { LorenzParams } from "../utils/lorenzMath"
import type { RGBColor } from "../utils/colorMapping"

/** Map volatility (0-100) to point size: calm = fine, chaotic = bold */
function volatilityToPointSize(volatility: number): number {
  const t = Math.max(0, Math.min(100, volatility)) / 100
  return 0.15 + 0.35 * t
}

interface LorenzSystemProps {
  targetParams: LorenzParams
  targetColor: RGBColor
  startColor?: RGBColor
  volatility?: number
  active: boolean
  position?: [number, number, number]
  onTransitionComplete?: () => void
}

export default function LorenzSystem({
  targetParams,
  targetColor,
  startColor,
  volatility = 50,
  active,
  position,
  onTransitionComplete,
}: LorenzSystemProps) {
  const { lineGeoRef, pointsGeoRef } = usePhaseLorenz({
    targetParams,
    targetColor,
    startColor,
    active,
    onTransitionComplete,
  })

  const pointSize = useMemo(() => volatilityToPointSize(volatility), [volatility])

  return (
    <group position={position}>
      <line>
        <bufferGeometry ref={lineGeoRef} />
        <lineBasicMaterial vertexColors toneMapped={false} />
      </line>

      <points>
        <bufferGeometry ref={pointsGeoRef} />
        <pointsMaterial
          size={pointSize}
          vertexColors
          toneMapped={false}
          sizeAttenuation
          transparent
          opacity={0.4}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
