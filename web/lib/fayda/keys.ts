import "server-only"

import { createPublicKey, generateKeyPairSync } from "node:crypto"

/**
 * Dev-only RSA keypairs for the mock eSignet provider and the demo client
 * (#25 / ADR-020). Generated in memory at module load so no private key ever
 * ships in the repo; the mock signs its JWTs and the demo client signs its
 * client_assertions with these. Nothing here is ever bundled into the client
 * graph (server-only callers only).
 */
export interface FaydaKeyPair {
  privateKeyPem: string
  publicKeyPem: string
  publicJwk: Record<string, unknown>
}

export interface JwksDocument {
  keys: Record<string, unknown>[]
}

// One shared modulus length; eSignet uses RSA/2048 (RS256).
const RSA_MODULUS_LENGTH = 2048

export function generateKeyPair(): FaydaKeyPair {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: RSA_MODULUS_LENGTH,
    publicExponent: 0x10001,
  })

  return {
    privateKeyPem: privateKey.export({ type: "pkcs8", format: "pem" }) as string,
    publicKeyPem: publicKey.export({ type: "spki", format: "pem" }) as string,
    publicJwk: publicKey.export({ format: "jwk" }) as Record<string, unknown>,
  }
}

// Import a PEM public key as a KeyObject so it can be handed to the JWT
// verifier. Fails loudly on malformed input.
export function importPublicKey(pem: string) {
  return createPublicKey(pem)
}

// Turn a JWK (as served from the provider's jwks_uri) back into a PEM public
// key, so the JWKS the app fetches from discovery can be fed to verifyJwt.
export function jwkToPublicKeyPem(jwk: Record<string, unknown>): string {
  const keyObject = createPublicKey({ key: jwk, format: "jwk" })
  return keyObject.export({ type: "spki", format: "pem" }) as string
}

// The mock's jwks.json body: the provider public key under a kid, RS256, sig
// use — the shape the client's signature-validation path consumes.
export function toJwks(
  keys: FaydaKeyPair | { publicJwk: Record<string, unknown> },
  kid: string
): JwksDocument {
  return {
    keys: [{ ...keys.publicJwk, kid, alg: "RS256", use: "sig" }],
  }
}

// In-memory dev keypairs shared between the in-app mock provider and the demo
// client (ADR-020 D6). The mock signs its id_token/userinfo JWTs with the
// provider key and verifies the client_assertion with the client key; in dev
// both keys are the same Next.js process, so a module-level singleton bridges
// the mock route and the app callback. In production the real esignet.ida.et
// holds the client JWK from onboarding, and this dev path is never used (the
// mock routes are unmounted under FAYDA_MOCK != "true").
let providerKeys: FaydaKeyPair | null = null
let devClientKeys: FaydaKeyPair | null = null

export function getProviderKeys(): FaydaKeyPair {
  if (!providerKeys) providerKeys = generateKeyPair()
  return providerKeys
}

export function getDevClientKeys(): FaydaKeyPair {
  if (!devClientKeys) devClientKeys = generateKeyPair()
  return devClientKeys
}

export function resetDevKeys(): void {
  providerKeys = null
  devClientKeys = null
}