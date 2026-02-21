import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `You are an expert decision analyst for a chaos-theory visualization app.
Given a short decision description, return a JSON object with exactly these fields:

- "volatility" (integer 0-100): How chaotic, risky, or unpredictable is this decision? 0 = totally routine, 100 = life-altering gamble.
- "focus" (integer 0-100): How clear and directed is the intent? 0 = aimless drift, 100 = laser-precise goal.
- "momentum" (integer 0-100): How much forward energy or urgency does it carry? 0 = idle contemplation, 100 = full sprint.
- "label" (string): A 2-3 word archetype for this decision (e.g. "Wild Gambit", "Steady Course", "Quiet Drift").
- "narrative" (string): One poetic sentence interpreting the emotional texture of this path.`;

function clampScore(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return 50;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function sanitize(parsed, input) {
  return {
    volatility: clampScore(parsed.volatility),
    focus: clampScore(parsed.focus),
    momentum: clampScore(parsed.momentum),
    label: typeof parsed.label === "string" ? parsed.label : "Unknown Path",
    narrative:
      typeof parsed.narrative === "string"
        ? parsed.narrative
        : `A path shaped by "${input.slice(0, 40)}".`,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { inputs } = req.body;
  if (!Array.isArray(inputs) || inputs.length === 0 || inputs.length > 2) {
    return res.status(400).json({ error: "Provide 1 or 2 decision strings." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured on server." });
  }

  try {
    const client = new GoogleGenAI({ apiKey });

    const results = await Promise.all(
      inputs.map(async (input) => {
        const response = await client.models.generateContent({
          model: "gemini-2.5-flash-lite",
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            temperature: 0.7,
          },
          contents: `Decision: "${input}"`,
        });

        const parsed = JSON.parse(response.text);
        return sanitize(parsed, input);
      })
    );

    return res.status(200).json(results);
  } catch (err) {
    console.error("[api/analyze] Gemini error:", err);
    return res.status(502).json({ error: "Gemini API request failed." });
  }
}
