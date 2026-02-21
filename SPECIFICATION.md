# Epsilon: Technical Specification

## 1. System Architecture

### 1.1 Overview
The application is a single-page React application built with Vite. It uses a layered architecture where the 3D visualization layer (`PhaseSpaceCanvas`) sits behind a UI layer (`UIOverlay`). State is managed globally via a Zustand store, serving as the single source of truth for simulation parameters and application phases.

### 1.2 Technology Stack
- **Core:** React 19, TypeScript, Vite
- **3D/Graphics:** Three.js, @react-three/fiber, @react-three/drei, @react-three/postprocessing
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **AI:** Google Gemini (`@google/genai`) via Vercel Serverless Function
- **Deployment:** Vercel (static frontend + `api/` serverless functions)
- **Linting:** ESLint

## 2. Core Modules

### 2.1 State Management (`epsilonStore.ts`)
The store manages the application lifecycle through three distinct phases:
1.  **Idle:** Waiting for user input.
2.  **Loading:** Processing input (simulating analysis latency).
3.  **Visualizing:** Rendering the attractor transition.

**Key State Properties:**
- `phase`: `idle` | `loading` | `visualizing`
- `mode`: `single` | `comparison`
- `inputs`: User text strings.
- `attractors`: Array of computed `AttractorData` (target parameters, colors, semantic analysis).

### 2.2 Physics Simulation (`lorenzMath.ts`)
The core physics engine uses a custom implementation of the Lorenz system equations:
$$
\begin{aligned}
\frac{dx}{dt} &= \sigma (y - x) \\
\frac{dy}{dt} &= x (\rho - z) - y \\
\frac{dz}{dt} &= xy - \beta z
\end{aligned}
$$

**Integration Method:** 4th-Order Runge-Kutta (RK4).
**Time Step ($dt$):** 0.005 (fixed).

**Parameter Mapping:**
The system maps semantic scores (0-100) to Lorenz parameters:
- **Focus** $\to$ $\sigma$ (Sigma): Range [6.0, 16.0]. Relates to Prandtl number (viscosity/thermal diffusivity).
- **Volatility** $\to$ $\rho$ (Rho): Range [26.0, 48.0]. The Rayleigh number; determines chaotic behavior.
- **Momentum** $\to$ $\beta$ (Beta): Range [1.5, 4.5]. Geometric factor related to physical dimensions.

**Status Quo:**
The system starts at a stable "Status Quo" state defined by $\rho = 24$, just below the Hopf bifurcation ($\rho \approx 24.74$), ensuring a stable but oscillatory initial state.

### 2.3 Semantic Analysis

**Backend Function (`api/analyze.js`):**
A Vercel serverless function that securely calls Google Gemini (`gemini-2.5-flash-lite`) using the `@google/genai` SDK. The API key (`GEMINI_API_KEY`) is stored server-side and never exposed to the client.
- Uses `systemInstruction` for consistent prompt engineering.
- Enforces `responseMimeType: "application/json"` for structured output.
- Validates and clamps all returned scores to the 0-100 range.

**Frontend Client (`aiAgent.ts`):**
A thin fetch wrapper that `POST`s decision text to `/api/analyze` and returns the parsed `SemanticAnalysis[]`. Falls back to the deterministic mock if the backend is unreachable.

**Mock Fallback (`mockAgent.ts`):**
A deterministic hashing algorithm (`mockLLMAnalysis`) used during local development or when the API is unavailable.
- Hashes input strings to a seed, then generates pseudo-random scores for Volatility, Focus, and Momentum.
- Produces a `SemanticAnalysis` object containing scores, a label (e.g., "Wild Card"), and a generated narrative.
- Simulates network delay (600ms - 1000ms).

### 2.4 Visualization (`LorenzSystem.tsx`)
Renders the attractor using a dual-layer technique:
1.  **Line Layer:** `THREE.Line` with `BufferGeometry` for the structural trail.
2.  **Glow Layer:** `THREE.Points` with dynamic point size mapped to volatility (bolder = more chaotic).

**Animation Logic (via `useLorenzSolver.ts` hook):**
- Time-based phase progression (warmup, transition, settle, complete) independent of frame rate.
- Linearly interpolates parameters from `STATUS_QUO_PARAMS` to target over the transition phase.
- Uses a ring-buffer system for efficient trail writes, then copies to display buffers for GPU upload, avoiding expensive `copyWithin` operations.
- `BufferAttribute`s are created once with `THREE.DynamicDrawUsage` to minimize GPU allocation churn.

**Comparison Mode Visuals:**
- **Distinct color palettes:** Choice A uses a Blue spectrum, Choice B uses an Orange spectrum, with volatility mapped to intensity/saturation within each hue.
- **Side-by-side layout:** Systems are placed at fixed X offsets (left/right) in a single canvas with widened separation (45 units).
- **Neutral status quo:** Grey start color in comparison mode to avoid clashing with Blue/Orange.

## 3. Component Structure

### `App.tsx`
Root component.
- Composes `PhaseSpaceCanvas` (z-index 0) and `UIOverlay` (z-index 10).
- Sets up the full-screen layout.

### `PhaseSpaceCanvas.tsx`
The Three.js canvas entry point.
- Configures the camera and scene.
- Handles post-processing effects (Bloom).
- Renders one or two `LorenzSystem` components based on the store's `attractors` state.

### `UIOverlay.tsx`
HTML overlay for user interaction.
- Contains input fields for decision text.
- Displays the "Visualize" button.
- Shows the semantic analysis results (Label, Narrative) when in the visualizing phase.

## 4. Data Flow
1.  **User Input:** User types text in `UIOverlay`.
2.  **Action:** User clicks "Visualize".
3.  **Store Update:** `epsilonStore` sets phase to `loading`.
4.  **Analysis:** `aiAgent.ts` sends decision text to `/api/analyze` (Vercel Function). The backend calls Google Gemini and returns structured scores. Falls back to `mockLLMAnalysis` if unreachable.
5.  **Mapping:** Scores are converted to Lorenz parameters via `scoresToParams`. Colors are assigned (volatility-based in single mode; Blue/Orange palettes in comparison mode).
6.  **Store Update:** `epsilonStore` sets phase to `visualizing` and updates `attractors`.
7.  **Render:** `LorenzSystem` detects active state and begins RK4 simulation, lerping parameters from defaults to targets.
8.  **Feedback:** `UIOverlay` displays the generated narrative and analysis labels.

## 5. Directory Structure
```
api/
└── analyze.js                 # Vercel serverless function (Gemini proxy)
src/
├── components/
│   ├── LorenzSystem.tsx       # 3D Attractor component
│   ├── PhaseSpaceCanvas.tsx   # Main 3D Scene wrapper
│   └── UIOverlay.tsx          # 2D Interface
├── hooks/
│   └── useLorenzSolver.ts     # Simulation logic hook (ring buffers, time-based)
├── store/
│   └── epsilonStore.ts        # Global Zustand store
├── utils/
│   ├── aiAgent.ts             # Frontend fetch client for /api/analyze
│   ├── colorMapping.ts        # Color generation (single + comparison palettes)
│   ├── lorenzMath.ts          # Math & Physics core
│   └── mockAgent.ts           # Deterministic fallback analysis
├── App.tsx                    # Root component
└── main.tsx                   # Entry point
```

