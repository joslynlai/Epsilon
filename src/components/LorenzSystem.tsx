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

import * as THREE from "three"
import { usePhaseLorenz } from "../hooks/useLorenzSolver"
import type { LorenzParams } from "../utils/lorenzMath"
import type { RGBColor } from "../utils/colorMapping"

interface LorenzSystemProps {
  targetParams: LorenzParams
  targetColor: RGBColor
  active: boolean
  onTransitionComplete?: () => void
}

export default function LorenzSystem({
  targetParams,
  targetColor,
  active,
  onTransitionComplete,
}: LorenzSystemProps) {
  const { lineGeoRef, pointsGeoRef } = usePhaseLorenz({
    targetParams,
    targetColor,
    active,
    onTransitionComplete,
  })

  return (
    <group>
      {/* Structural trail — native thin line */}
      <line>
        <bufferGeometry ref={lineGeoRef} />
        <lineBasicMaterial vertexColors toneMapped={false} />
      </line>

      {/* Glow layer — points bloom into soft orbs under post-processing */}
      <points>
        <bufferGeometry ref={pointsGeoRef} />
        <pointsMaterial
          size={0.25}
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
