import "server-only"

import { createSign, createVerify, randomBytes } from "node:crypto"

import { importPublicKey } from "@/lib/fayda/keys"

/**
 * Minimal RS256 JWT helpers (#25 / ADR-020), built on node:crypto — no
 * dependency on `jose`, which is not in the web package.json. Server-only
 * callers use these to sign the mock provider's id_token/userinfo JWTs and to
 * validate the provider's signed responses; the same code path runs against
 * the real eSignet (issuer/audience swapped via config).
 *
 * JWT shape: base64url(header).base64url(payload).signature, RS256.
 */

export interface JwtHeader {
  alg: string
  typ?: string
  kid?: string
}

export interface JwtClaims {
  iss?: string
  sub?: string
  aud?: string | string[]
  iat?: number
  exp?: number
  [key: string]: unknown
}

export interface JwtVerifyOptions {
  issuer?: string
  audience?: string
}

export function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url")
}

export function base64UrlDecode(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8")
}

function signInput(header: JwtHeader, claims: JwtClaims): string {
  return `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claims)
  )}`
}

// Sign a JWT with RS256 using a PEM private key. Returns the compact JWT.
export function signJwt(
  claims: JwtClaims,
  privateKeyPem: string,
  options: { kid?: string } = {}
): string {
  const header: JwtHeader = { alg: "RS256", typ: "JWT", ...(options.kid ? { kid: options.kid } : {}) }
  const data = signInput(header, claims)
  const signature = createSign("RSA-SHA256")
    .update(data)
    .sign(privateKeyPem)
  return `${data}.${base64UrlEncode(signature)}`
}

// Split a compact JWT into its three base64url segments, or null.
export function parseJwt(token: string): {
  header: JwtHeader
  claims: JwtClaims
  signature: string
} | null {
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [encodedHeader, encodedClaims, signature] = parts
  try {
    return {
      header: JSON.parse(base64UrlDecode(encodedHeader)) as JwtHeader,
      claims: JSON.parse(base64UrlDecode(encodedClaims)) as JwtClaims,
      signature,
    }
  } catch {
    return null
  }
}

// Verify a JWT's RS256 signature against a PEM public key and, when provided,
// its issuer/audience/expiry. Returns the claims on success, null otherwise.
export function verifyJwt(
  token: string,
  publicKeyPem: string,
  options: JwtVerifyOptions = {}
): JwtClaims | null {
  const parsed = parseJwt(token)
  if (!parsed) return null
  if (parsed.header.alg !== "RS256") return null

  const { header, claims, signature } = parsed
  const data = `${base64UrlEncode(JSON.stringify(header))}.${base64UrlEncode(
    JSON.stringify(claims)
  )}`

  const valid = createVerify("RSA-SHA256")
    .update(data)
    .verify(importPublicKey(publicKeyPem), Buffer.from(signature, "base64url"))
  if (!valid) return null

  if (options.issuer !== undefined && claims.iss !== options.issuer) return null
  if (options.audience !== undefined) {
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
    if (!audiences.includes(options.audience)) return null
  }
  if (claims.exp !== undefined && claims.exp * 1000 <= Date.now()) return null

  return claims
}

// URL-safe random values: the OAuth `state` (CSRF nonce) and the PKCE
// `code_verifier` (43+ chars per RFC 7636 §4.1).
export function randomState(byteLength = 16): string {
  return randomBytes(byteLength).toString("base64url")
}

export function randomVerifier(byteLength = 32): string {
  return randomBytes(byteLength).toString("base64url")
}