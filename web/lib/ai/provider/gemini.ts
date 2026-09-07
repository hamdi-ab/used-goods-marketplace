import {
  AI_LISTING_BASE_URL,
  AI_LISTING_TIMEOUT_MS,
} from "@/lib/ai/constants"
import type {
  GeminiProvider,
  GeminiRequest,
  GeminiResponse,
  GeminiResult,
} from "./types"

export class GeminiFlashProvider implements GeminiProvider {
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly timeoutMs: number

  constructor(options: { apiKey?: string; baseUrl?: string; timeoutMs?: number } = {}) {
    this.apiKey = options.apiKey ?? process.env.GEMINI_API_KEY ?? ""
    this.baseUrl = options.baseUrl ?? `${AI_LISTING_BASE_URL}?key=${this.apiKey}`
    this.timeoutMs = options.timeoutMs ?? AI_LISTING_TIMEOUT_MS
  }

  async generate<T>(
    prompt: string,
    images: Array<{ mimeType: string; data: string }>,
    schema: Record<string, unknown>
  ): Promise<GeminiResult<T>> {
    if (!this.apiKey) {
      return { ok: false, reason: "unavailable", message: "AI assist is unavailable right now" }
    }

    const body: GeminiRequest = {
      contents: [
        {
          parts: [
            { text: prompt },
            ...images.map((img) => ({
              inlineData: { mimeType: img.mimeType, data: img.data },
            })),
          ],
        },
      ],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    }

    let res: Response
    try {
      res = await fetch(this.baseUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.timeoutMs),
      })
    } catch {
      return { ok: false, reason: "degraded", message: "AI request failed" }
    }

    if (res.status === 429) {
      return { ok: false, reason: "rate_limited", message: "AI assist is busy right now — try again shortly" }
    }
    if (res.status === 403) {
      return { ok: false, reason: "unavailable", message: "AI assist is unavailable right now" }
    }
    if (!res.ok) {
      return { ok: false, reason: "degraded", message: "AI request failed" }
    }

    const json = (await res.json().catch(() => null)) as GeminiResponse | null
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return { ok: false, reason: "degraded", message: "AI request failed" }
    }

    try {
      return { ok: true, data: JSON.parse(text) as T }
    } catch {
      return { ok: false, reason: "degraded", message: "AI request failed" }
    }
  }
}
