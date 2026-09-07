export interface GeminiPromptPart {
  text: string
}

export interface GeminiInlinePart {
  inlineData: { mimeType: string; data: string }
}

export interface GeminiContent {
  parts: (GeminiPromptPart | GeminiInlinePart)[]
}

export interface GeminiRequest {
  contents: GeminiContent[]
  generationConfig: {
    temperature: number
    maxOutputTokens: number
    responseMimeType: string
    responseSchema: Record<string, unknown>
  }
}

export interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
}

export type GeminiResult<T> =
  | { ok: true; data: T }
  | { ok: false; reason: "unavailable" | "rate_limited" | "degraded"; message: string }

export interface GeminiProvider {
  generate<T>(
    prompt: string,
    images: Array<{ mimeType: string; data: string }>,
    schema: Record<string, unknown>
  ): Promise<GeminiResult<T>>
}
