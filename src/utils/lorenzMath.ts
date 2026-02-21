/**
 * lorenzMath.ts
 *
 * Pure mathematical functions for the Lorenz Attractor.
 * Uses 4th-order Runge-Kutta (RK4) integration for accuracy.
 *
 * Key concept: STATUS_QUO_PARAMS (ρ=24) sits just below the Hopf
 * bifurcation at ρ≈24.74. The system is technically stable, but
 * convergence is extremely slow — trajectories show large, quasi-periodic
 * oscillations. When the user's choice pushes ρ above 24.74, the system
 * crosses into chaos and the butterfly unfolds.
 */

export interface LorenzParams {
  sigma: number
  rho: number
  beta: number
}

export interface Vec3 {
  x: number
  y: number
  z: number
}

/** Lorenz system derivative: returns dx/dt, dy/dt, dz/dt */
function lorenzDerivative(p: Vec3, params: LorenzParams): Vec3 {
  return {
    x: params.sigma * (p.y - p.x),
    y: p.x * (params.rho - p.z) - p.y,
    z: p.x * p.y - params.beta * p.z,
  }
}

/** Single RK4 step — 4 derivative evaluations for high accuracy */
export function rk4Step(pos: Vec3, params: LorenzParams, dt: number): Vec3 {
  const k1 = lorenzDerivative(pos, params)

  const p2: Vec3 = {
    x: pos.x + (dt / 2) * k1.x,
    y: pos.y + (dt / 2) * k1.y,
    z: pos.z + (dt / 2) * k1.z,
  }
  const k2 = lorenzDerivative(p2, params)

  const p3: Vec3 = {
    x: pos.x + (dt / 2) * k2.x,
    y: pos.y + (dt / 2) * k2.y,
    z: pos.z + (dt / 2) * k2.z,
  }
  const k3 = lorenzDerivative(p3, params)

  const p4: Vec3 = {
    x: pos.x + dt * k3.x,
    y: pos.y + dt * k3.y,
    z: pos.z + dt * k3.z,
  }
  const k4 = lorenzDerivative(p4, params)

  return {
    x: pos.x + (dt / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x),
    y: pos.y + (dt / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y),
    z: pos.z + (dt / 6) * (k1.z + 2 * k2.z + 2 * k3.z + k4.z),
  }
}

/** Linearly interpolate between two parameter sets */
export function lerpParams(a: LorenzParams, b: LorenzParams, t: number): LorenzParams {
  return {
    sigma: a.sigma + (b.sigma - a.sigma) * t,
    rho: a.rho + (b.rho - a.rho) * t,
    beta: a.beta + (b.beta - a.beta) * t,
  }
}

/** Map a 0-100 score to a [min, max] range via linear interpolation */
export function mapScore(score: number, min: number, max: number): number {
  const clamped = Math.max(0, Math.min(100, score))
  return min + (clamped / 100) * (max - min)
}

/**
 * Map LLM semantic scores to Lorenz parameters.
 *
 * ρ (rho) range [26, 48] ensures every choice is above the Hopf bifurcation
 * at ρ≈24.74, so the transition from STATUS_QUO always crosses into chaos.
 */
export function scoresToParams(scores: {
  volatility: number
  focus: number
  momentum: number
}): LorenzParams {
  return {
    sigma: mapScore(scores.focus, 6.0, 16.0),
    rho: mapScore(scores.volatility, 26.0, 48.0),
    beta: mapScore(scores.momentum, 1.5, 4.5),
  }
}

/**
 * Status quo: ρ=24, just below the Hopf bifurcation at ρ≈24.74.
 *
 * Trajectories show large, slow quasi-periodic oscillations
 * (critical slowing down) — alive but stable. A perfect "comfort zone."
 */
export const STATUS_QUO_PARAMS: LorenzParams = { sigma: 10, rho: 24, beta: 8 / 3 }

/** Default initial condition near the attractor basin */
export const DEFAULT_INITIAL: Vec3 = { x: 1.0, y: 1.0, z: 1.0 }

/** Integration time step */
export const DT = 0.005
