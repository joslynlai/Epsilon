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
import LorenzSystem from "./LorenzSystem"

/** Camera positioned for a good 3/4 view of the attractor region */
const CAMERA_POS: [number, number, number] = [55, 35, 65]
const ORBIT_TARGET: [number, number, number] = [0, 0, 27]

function Scene() {
  const phase = useEpsilonStore((s) => s.phase)
  const attractors = useEpsilonStore((s) => s.attractors)
  const onTransitionComplete = useEpsilonStore((s) => s.onTransitionComplete)

  const active = phase === "visualizing"

  if (attractors.length === 0) return null

  return (
    <>
      {/* Choice A — always rendered */}
      <LorenzSystem
        targetParams={attractors[0].targetParams}
        targetColor={attractors[0].targetColor}
        active={active}
        onTransitionComplete={onTransitionComplete}
      />

      {/* Choice B — comparison mode only */}
      {attractors.length > 1 && (
        <LorenzSystem
          targetParams={attractors[1].targetParams}
          targetColor={attractors[1].targetColor}
          active={active}
        />
      )}
    </>
  )
}

export default function PhaseSpaceCanvas() {
  const phase = useEpsilonStore((s) => s.phase)

  return (
    <div className="absolute inset-0">
      {phase === "visualizing" && (
        <Canvas
          camera={{
            position: CAMERA_POS,
            fov: 65,
            near: 0.1,
            far: 500,
          }}
          gl={{ antialias: true, alpha: false }}
          style={{ background: "#000000" }}
        >
          <ambientLight intensity={0.01} />

          <Scene />

          <OrbitControls
            target={ORBIT_TARGET}
            autoRotate
            autoRotateSpeed={0.3}
            enableDamping
            dampingFactor={0.05}
            minDistance={20}
            maxDistance={200}
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
