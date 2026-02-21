# Epsilon: Interactive Phase Space Visualizer

## 1. Executive Summary
**Epsilon** is an interactive web-based visualization tool that maps human decisions and semantic concepts onto chaotic mathematical systems. By interpreting user input through a simulated semantic analysis engine, Epsilon renders dynamic, evolving Lorenz attractors that visually represent the "shape" of a choice. The project bridges the gap between abstract nonlinear dynamics and intuitive human meaning, offering a unique way to explore the consequences of decisions through the lens of chaos theory.

## 2. Problem Statement
Complex decision-making is often abstract and difficult to visualize. While people intuitively understand concepts like "volatility," "momentum," and "focus," they rarely have a visual language to represent them. Traditional data visualization tools are too rigid for abstract concepts, while pure generative art often lacks meaningful user agency. Epsilon provides a middle ground: a scientifically grounded yet artistically expressive medium for visualizing the dynamics of choice.

## 3. Solution Overview
Epsilon utilizes the **Lorenz System**, a set of differential equations known for its "butterfly effect," as the core generative engine.
- **Input:** Users provide text descriptions of decisions or scenarios.
- **Analysis:** A Vercel serverless function calls Google Gemini to analyze the input for key dimensions: Volatility, Focus, and Momentum. A deterministic mock fallback is used when offline or during local development.
- **Mapping:** These dimensions are mathematically mapped to the Lorenz system's parameters ($\rho$, $\sigma$, $\beta$).
- **Visualization:** The system renders the resulting trajectory in real-time 3D, transitioning smoothly from a stable "Status Quo" to the unique chaotic attractor defined by the user's input.

## 4. Key Features
- **Text-to-Chaos Mapping:** Converts arbitrary text input into precise mathematical parameters.
- **Real-time 3D Rendering:** High-performance WebGL visualization using Three.js and React Three Fiber.
- **Dual-Mode Visualization:**
    - **Single Mode:** Visualize a single decision's trajectory.
    - **Comparison Mode:** Compare two distinct decisions side-by-side in the same phase space.
- **Dynamic Phase Transitions:** Smooth interpolation between system states, visualizing the evolution from stability to chaos.
- **Aesthetic Post-Processing:** Bloom effects and dynamic coloring to enhance the visual experience.

## 5. Target Audience
- **Data Artists & Creative Coders:** Interested in generative algorithms and math-art intersections.
- **Educators & Students:** For demonstrating chaos theory, bifurcations, and phase space dynamics.
- **General Public:** As an interactive "decision fingerprint" or digital toy.

## 6. Technical Approach
- **Frontend Framework:** React 19 with TypeScript and Vite for a modern, type-safe development environment.
- **Graphics Engine:** Three.js via `@react-three/fiber` for declarative 3D scene management.
- **Physics Engine:** Custom 4th-order Runge-Kutta (RK4) integrator for accurate, real-time physics simulation.
- **State Management:** Zustand for global application state (phases, inputs, attractor data).
- **Styling:** Tailwind CSS for a clean, minimal UI overlay.
- **AI Backend:** Google Gemini (`gemini-2.5-flash-lite`) via a Vercel serverless function for secure, server-side semantic analysis.
- **Deployment:** Vercel (static frontend + serverless API).

## 7. Future Roadmap
- **Export Capabilities:** Allow users to export high-resolution images or videos of their attractors.
- **Expanded Mathematical Models:** Support other chaotic attractors (e.g., Rössler, Aizawa).
- **Social Sharing:** Enable users to share their "decision shapes" via unique URLs.

