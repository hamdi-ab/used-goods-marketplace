# Gemini Vision Proof (AI Listing Assistant seam verification)

> **Project:** VinTech Challenge 2026
>
> **Version:** 1.0
>
> **Owner:** Engineering Team
>
> **Status:** Draft
>
> **Last Updated:** August 2026

> **Purpose:** this is the deliverable of the "prove the seam with one real photo" scout. It de-risks ADR-009/ADR-019 before T14 builds against Gemini: confirm the model alias works, an API key is good, structured-JSON output parses, and the token math holds. It is a **verification runbook**, not application code.

# 1. Gate

- Needs a **Gemini API key** from Google AI Studio (free tier, no card). See tracker ticket T23 for the credential prep list.
- Needs one real listing-style photo (any JPEG/PNG/WebP of a used item is fine for the proof).

# 2. The call

Single `generateContent` (or Interactions `create`) call to a flash multimodal alias with:

```text
model: gemini-2.5-flash
input:
  - one image (the item photo)
  - prompt: "Return a strict JSON object for this product listing photo.
    {title, description, category, keywords [3], condition, quality_score}
    category, one of: Electronics|Furniture|Home Appliances|Vehicles|Fashion|
    Books|Sports|Baby & Kids|Other. condition one of: Brand New|Like New|
    Lightly Used|Fair Condition|For Parts. quality_score 0-100."
  - anyOf / schema envelope per SDK for strict structured output
```

Expected: one parseable JSON object with the six fields; category and condition values from the enumerations in the domain model/DB spec; `quality_score` in range.

# 3. What to capture (the four claims to verify)

1. **Model alias works** — request succeeds with `gemini-2.5-flash` (or the then-current flash alias), HTTP 200, no 429.
2. **Key is live** — the free-tier key authenticates (`GEMINI_API_KEY` env var), no `API_KEY_INVALID`.
3. **Structured output** — response object `usage_metadata` is present, and the JSON parse succeeds against the schema; enums match our domain exactly.
4. **Token math** — read input tokens from `usage_metadata.total_token_count` (or `prompt_token_count`). Sanity-compare with ADR-019's expectation (~0.5k–2.6k for one resized photo).
5. **Latency** — note wall-clock time; flash on free tier is typically sub-5s for one image.

# 4. How to run it

One-off command or a throwaway script that:

1. reads the image path,
2. encodes as base64 inline part,
3. posts the request to the **Gemini REST endpoint** with the JSON-schema envelope,
4. asserts `response.prompt_feedback` has no block and output parses,
5. prints input/output tokens + wall-clock seconds.

Stop at the first red line: a 429 means RPD/RPM throttling (see ADR-019's rate-limit note); an invalid key means the T23 key is still missing.

# 5. Success line

The proof passes when a single photo round-trips to a valid structured listing (title, category, condition, quality score) with token usage inside the ADR-019 budget. Log the result (model alias, tokens, latency) onto T14 and close T23.

# 6. Fallback

If proof is blocked (key missing, or outlier image), the app still ships: FS-005 keeps manual listing creation as the primary path, and the AI input is best-effort polish in the demo, not a dependency.