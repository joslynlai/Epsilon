/**
 * PhaseSpaceCanvas.tsx
 *
 * The R3F Canvas wrapper — scene, camera, lights,
 * post-processing (Bloom + ChromaticAberration), and OrbitControls.
 *
 * Renders one or two LorenzSystem components. In comparison mode,
 * both share the same origin and status-quo starting state;
 * they diverge as their target parameters differ during the transition.
 */

import { Canvas } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
} from "@react-three/postprocessing"
import { BlendFunction } from "postprocessing"
import { Vector2 } from "three"
import { useEpsilonStore } from "../store/epsilonStore"
import { COMPARISON_STATUS_QUO_COLOR } from "../utils/colorMapping"
import LorenzSystem from "./LorenzSystem"

/** X-axis offset per side in comparison mode (wide enough to prevent wing overlap) */
const COMPARISON_OFFSET = 45

const SINGLE_CAMERA: [number, number, number] = [55, 35, 65]
const SINGLE_TARGET: [number, number, number] = [0, 0, 27]

const COMPARE_CAMERA: [number, number, number] = [0, 55, 160]
const COMPARE_TARGET: [number, number, number] = [0, 0, 27]

function Scene() {
  const phase = useEpsilonStore((s) => s.phase)
  const attractors = useEpsilonStore((s) => s.attractors)
  const onTransitionComplete = useEpsilonStore((s) => s.onTransitionComplete)

  const active = phase === "visualizing"
  const isCompare = attractors.length > 1

  if (attractors.length === 0) return null

  return (
    <>
      <LorenzSystem
        targetParams={attractors[0].targetParams}
        targetColor={attractors[0].targetColor}
        startColor={isCompare ? COMPARISON_STATUS_QUO_COLOR : undefined}
        volatility={attractors[0].analysis.volatility}
        active={active}
        position={isCompare ? [-COMPARISON_OFFSET, 0, 0] : undefined}
        onTransitionComplete={onTransitionComplete}
      />

      {isCompare && (
        <LorenzSystem
          targetParams={attractors[1].targetParams}
          targetColor={attractors[1].targetColor}
          startColor={COMPARISON_STATUS_QUO_COLOR}
          volatility={attractors[1].analysis.volatility}
          active={active}
          position={[COMPARISON_OFFSET, 0, 0]}
        />
      )}
    </>
  )
}

export default function PhaseSpaceCanvas() {
  const phase = useEpsilonStore((s) => s.phase)
  const mode = useEpsilonStore((s) => s.mode)
  const isCompare = mode === "comparison"

  const cameraPos = isCompare ? COMPARE_CAMERA : SINGLE_CAMERA
  const orbitTarget = isCompare ? COMPARE_TARGET : SINGLE_TARGET

  return (
    <div className="absolute inset-0">
      {phase === "visualizing" && (
        <Canvas
          camera={{
            position: cameraPos,
            fov: isCompare ? 75 : 65,
            near: 0.1,
            far: 500,
          }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000000" }}
        >
          <ambientLight intensity={0.01} />

          <Scene />

          <OrbitControls
            target={orbitTarget}
            autoRotate
            autoRotateSpeed={0.3}
            enableDamping
            dampingFactor={0.05}
            minDistance={20}
            maxDistance={300}
          />

          <EffectComposer>
            {/* Bloom: low threshold catches the bright trail head and glow points */}
            <Bloom
              luminanceThreshold={0.05}
              intensity={3.0}
              mipmapBlur
              radius={0.85}
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new Vector2(0.0004, 0.0004)}
              radialModulation={false}
              modulationOffset={0.0}
            />
          </EffectComposer>
        </Canvas>
      )}
    </div>
  )
}
