/**
 * App.tsx
 *
 * Root component. Layers:
 *   1. PhaseSpaceCanvas (full-screen WebGL, z-0)
 *   2. UIOverlay (pointer-events-none HTML, z-10)
 *
 * All state lives in the Zustand store — App simply composes the two layers.
 */

import PhaseSpaceCanvas from "./components/PhaseSpaceCanvas"
import UIOverlay from "./components/UIOverlay"

export default function App() {
  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <PhaseSpaceCanvas />
      <UIOverlay />
    </div>
  )
}
