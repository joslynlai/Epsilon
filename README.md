# Epsilon: Interactive Phase Space Visualizer

> **Note:** This is an early experimental prototype. The project is under active development and subject to change.

**Epsilon** is an interactive web-based visualization tool that maps human decisions and semantic concepts onto chaotic mathematical systems. By interpreting user input through Google Gemini, Epsilon renders dynamic, evolving Lorenz attractors that visually represent the "shape" of a choice -- bridging abstract nonlinear dynamics and intuitive human meaning through the lens of chaos theory.

## Features

- **Text-to-Chaos Mapping:** Converts arbitrary text input into precise mathematical parameters via AI semantic analysis.
- **Real-time 3D Rendering:** High-performance WebGL visualization using Three.js and React Three Fiber.
- **Dual-Mode Visualization:**
    - **Single Mode:** Visualize a single decision's trajectory.
    - **Comparison Mode:** Compare two decisions side-by-side with distinct Blue/Orange color palettes.
- **Dynamic Phase Transitions:** Smooth interpolation from a stable "Status Quo" to the unique chaotic attractor defined by the user's input.
- **Aesthetic Post-Processing:** Bloom effects, volatility-driven line thickness, and dynamic coloring.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| 3D/Graphics | Three.js, @react-three/fiber, @react-three/postprocessing |
| State | Zustand |
| Styling | Tailwind CSS |
| AI Backend | Google Gemini (`@google/genai`) via Vercel Serverless Function |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Gemini API key](https://aistudio.google.com/apikey) (free tier)

### Local Development

```bash
# Install dependencies
npm install

# Create your env file from the example
cp .env.example .env
# Edit .env and add your real GEMINI_API_KEY

# Start the dev server
npm run dev
```

Open http://localhost:5173 in your browser. During local development, the app uses a deterministic mock for semantic analysis. The real Gemini integration activates when deployed to Vercel.

### Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com).
3. Add `GEMINI_API_KEY` in **Settings > Environment Variables**.
4. Deploy. The `api/analyze.js` serverless function handles Gemini calls securely on the server.

## How It Works

1. User types a decision (e.g., "Quit my job and travel the world").
2. The backend analyzes it for **Volatility**, **Focus**, and **Momentum** (0-100 each).
3. These scores map to the Lorenz system's parameters ($\sigma$, $\rho$, $\beta$).
4. A 3D attractor renders in real-time, transitioning from a stable equilibrium to the chaotic shape of the decision.

## Project Structure

```
api/
└── analyze.js                 # Vercel serverless function (Gemini proxy)
src/
├── components/
│   ├── LorenzSystem.tsx       # 3D Attractor renderer
│   ├── PhaseSpaceCanvas.tsx   # Scene, camera, post-processing
│   └── UIOverlay.tsx          # Input form and analysis readout
├── hooks/
│   └── useLorenzSolver.ts     # RK4 simulation with ring buffers
├── store/
│   └── epsilonStore.ts        # Zustand state machine
├── utils/
│   ├── aiAgent.ts             # Frontend fetch client for /api/analyze
│   ├── colorMapping.ts        # Color palettes (single + comparison)
│   ├── lorenzMath.ts          # Lorenz equations and RK4 integrator
│   └── mockAgent.ts           # Deterministic fallback analysis
├── App.tsx
└── main.tsx
```
