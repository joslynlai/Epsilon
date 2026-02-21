/**
 * aiAgent.ts
 *
 * Calls the server-side /api/analyze endpoint (Vercel Function)
 * which proxies Google Gemini.
 *
 * Falls back to the deterministic mock if the endpoint is unreachable.
 */

import { mockLLMAnalysis, type SemanticAnalysis } from "./mockAgent"

/**
 * Analyze one or more decision inputs via the backend.
 * Falls back to mock if the server request fails.
 */
export async function analyzeDecisions(
  inputs: string[]
): Promise<SemanticAnalysis[]> {
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inputs }),
    })

    if (!res.ok) {
      throw new Error(`Server responded ${res.status}`)
    }

    return (await res.json()) as SemanticAnalysis[]
  } catch (err) {
    console.error("[Epsilon] Backend analysis failed, falling back to mock:", err)
    return mockLLMAnalysis(inputs)
  }
}
