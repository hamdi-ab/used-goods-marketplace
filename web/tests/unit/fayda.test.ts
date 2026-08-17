import { describe, it, expect } from "vitest"

import {
  generateKeyPair,
  toJwks,
  getProviderKeys,
  getDevClientKeys,
  resetDevKeys,
  type FaydaKeyPair,
} from "@/lib/fayda/keys"
import {
  derivePkceChallenge,
  buildAuthorizeUrl,
  buildTokenRequestBody,
  parseDiscovery,
  parseTokenResponse,
  buildClientAssertion,
  FAYDA_SCOPE,
  FAYDA_TEST_SUB,
  FAYDA_MOCK_KID,
} from "@/lib/fayda/constants"
import {
  signJwt,
  verifyJwt,
  parseJwt,
  randomState,
  randomVerifier,
} from "@/lib/fayda/jwt"
import {
  validateAuthorizeRequest,
  issueAuthorizationCode,
  exchangeAuthorizationCode,
  issueUserinfo,
  type MockCodeStore,
  type MockKeys,
} from "@/lib/fayda/mock"
import {
  recordFaydaVerification,
  verifyAndRecord,
  completeFaydaAuthorization,
} from "@/lib/fayda/verification"

describe("fayda.jwt", () => {
  const keys: FaydaKeyPair = generateKeyPair()

  function signed(claims: Record<string, unknown>): string {
    return signJwt(claims, keys.privateKeyPem, { kid: "test" })
  }

  it("signs and verifies a round-trip RS256 JWT", () => {
    const token = signed({ iss: "mock", sub: "fayda-test-0001", aud: "client" })
    expect(parseJwt(token)?.header.alg).toBe("RS256")
    expect(parseJwt(token)?.claims.sub).toBe("fayda-test-0001")
    expect(verifyJwt(token, keys.publicKeyPem)).toMatchObject({
      iss: "mock",
      sub: "fayda-test-0001",
    })
  })

  it("verifies the issuer and audience when requested", () => {
    const token = signed({ iss: "mock", sub: "s", aud: "client" })
    expect(verifyJwt(token, keys.publicKeyPem, { issuer: "mock", audience: "client" })).not.toBeNull()
    expect(verifyJwt(token, keys.publicKeyPem, { issuer: "other" })).toBeNull()
    expect(verifyJwt(token, keys.publicKeyPem, { audience: "other" })).toBeNull()
  })

  it("rejects a token signed with a different key", () => {
    const other: FaydaKeyPair = generateKeyPair()
    const token = signed({ sub: "s" })
    expect(verifyJwt(token, other.publicKeyPem)).toBeNull()
  })

  it("rejects a tampered payload", () => {
    const token = signed({ sub: "fayda-test-0001" })
    const tampered = token.slice(0, -4) + (token.endsWith("AAA=") ? "AAA" : "AAAA")
    expect(verifyJwt(tampered, keys.publicKeyPem)).toBeNull()
  })

  it("rejects an expired token", () => {
    const token = signed({ sub: "s", exp: Math.floor(Date.now() / 1000) - 60 })
    expect(verifyJwt(token, keys.publicKeyPem)).toBeNull()
  })

  it("returns null for a non-JWT string", () => {
    expect(parseJwt("not-a-jwt")).toBeNull()
    expect(verifyJwt("not-a-jwt", keys.publicKeyPem)).toBeNull()
  })

  it("produces URL-safe random state and verifier", () => {
    expect(randomState()).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(randomVerifier().length).toBeGreaterThanOrEqual(43)
  })
})

describe("fayda.keys", () => {
  it("generates an RSA keypair with PEM exports", () => {
    const keys = generateKeyPair()
    expect(keys.privateKeyPem).toContain("BEGIN PRIVATE KEY")
    expect(keys.publicKeyPem).toContain("BEGIN PUBLIC KEY")
  })

  it("exports a JWKS with the public key material", () => {
    const keys = generateKeyPair()
    const jwks = toJwks(keys, "kid-1")
    expect(jwks.keys).toHaveLength(1)
    expect(jwks.keys[0]).toMatchObject({
      kid: "kid-1",
      kty: "RSA",
      alg: "RS256",
      use: "sig",
    })
    expect(jwks.keys[0].n).toBeTruthy()
    expect(jwks.keys[0].e).toBe("AQAB")
  })
})

describe("fayda.constants", () => {
  it("declares the verify-only scope and test identity", () => {
    expect(FAYDA_SCOPE).toBe("openid")
    expect(FAYDA_TEST_SUB).toBe("fayda-test-0001")
  })

  it("derives the RFC 7636 S256 PKCE challenge", () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk"
    expect(derivePkceChallenge(verifier)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM"
    )
  })

  it("builds a verify-only authorize URL with no claims", () => {
    const url = buildAuthorizeUrl({
      issuerBase: "https://esignet.ida.et",
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      state: "abc123",
      codeChallenge: "challenge-value",
    })
    const parsed = new URL(url)
    expect(parsed.origin + parsed.pathname).toBe("https://esignet.ida.et/authorize")
    expect(parsed.searchParams.get("response_type")).toBe("code")
    expect(parsed.searchParams.get("client_id")).toBe("client-1")
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      "http://localhost:3000/verify-fayda/callback"
    )
    expect(parsed.searchParams.get("scope")).toBe("openid")
    expect(parsed.searchParams.get("state")).toBe("abc123")
    expect(parsed.searchParams.get("code_challenge")).toBe("challenge-value")
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256")
    expect(parsed.searchParams.has("claims")).toBe(false)
    expect(parsed.searchParams.has("acr_values")).toBe(false)
  })

  it("parses a discovery document and surfaces endpoints", () => {
    const doc = parseDiscovery({
      issuer: "https://esignet.ida.et",
      authorization_endpoint: "https://esignet.ida.et/authorize",
      token_endpoint: "https://esignet.ida.et/v1/esignet/oauth/token",
      userinfo_endpoint: "https://esignet.ida.et/v1/esignet/oidc/userinfo",
      jwks_uri: "https://esignet.ida.et/v1/esignet/oidc/jwks",
      scopes_supported: ["openid"],
    })
    expect(doc.authorization_endpoint).toBe("https://esignet.ida.et/authorize")
    expect(doc.token_endpoint).toContain("/v1/esignet/oauth/token")
    expect(doc.userinfo_endpoint).toContain("/oidc/userinfo")
    expect(doc.jwks_uri).toContain("/jwks")
  })

  it("builds a form-encoded token request with client_assertion", () => {
    const body = buildTokenRequestBody({
      tokenEndpoint: "https://esignet.ida.et/v1/esignet/oauth/token",
      clientId: "client-1",
      code: "auth-code-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      codeVerifier: "verifier-1",
      clientAssertion: "eyJassertion",
    })
    expect(body.get("grant_type")).toBe("authorization_code")
    expect(body.get("code")).toBe("auth-code-1")
    expect(body.get("redirect_uri")).toBe("http://localhost:3000/verify-fayda/callback")
    expect(body.get("client_id")).toBe("client-1")
    expect(body.get("code_verifier")).toBe("verifier-1")
    expect(body.get("client_assertion")).toBe("eyJassertion")
    expect(body.get("client_assertion_type")).toBe(
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    )
  })

  it("parses a token response into access/id tokens", () => {
    const parsed = parseTokenResponse({
      access_token: "at-1",
      id_token: "it-1",
      token_type: "Bearer",
      expires_in: 3600,
    })
    expect(parsed).toEqual({
      accessToken: "at-1",
      idToken: "it-1",
    })
  })

  it("rejects a token response without an access token", () => {
    expect(() => parseTokenResponse({ error: "invalid_grant" })).toThrow()
  })
})

describe("fayda.mock", () => {
  const provider: MockKeys = { ...generateKeyPair() }
  const clientKeys = generateKeyPair()

  function store(): MockCodeStore {
    return new Map() as MockCodeStore
  }

  it("accepts a valid authorize request and rejects a mismatched redirect_uri", () => {
    const ok = validateAuthorizeRequest({
      responseType: "code",
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      scope: "openid",
      state: "s1",
      codeChallenge: "ch1",
      codeChallengeMethod: "S256",
      registeredRedirectUri: "http://localhost:3000/verify-fayda/callback",
    })
    expect(ok.ok).toBe(true)

    const bad = validateAuthorizeRequest({
      responseType: "code",
      clientId: "client-1",
      redirectUri: "http://evil.example/cb",
      scope: "openid",
      state: "s1",
      codeChallenge: "ch1",
      codeChallengeMethod: "S256",
      registeredRedirectUri: "http://localhost:3000/verify-fayda/callback",
    })
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error).toBe("invalid_request")
  })

  it("refuses authorize requests without the openid scope", () => {
    const res = validateAuthorizeRequest({
      responseType: "code",
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      scope: "profile",
      state: "s1",
      codeChallenge: "ch1",
      codeChallengeMethod: "S256",
      registeredRedirectUri: "http://localhost:3000/verify-fayda/callback",
    })
    expect(res.ok).toBe(false)
    if (!res.ok) expect(res.error).toBe("invalid_scope")
  })

  it("issues a single-use code bound to its challenge", () => {
    const codes = store()
    const issued = issueAuthorizationCode(codes, {
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      state: "s1",
      codeChallenge: "ch1",
      codeChallengeMethod: "S256",
    })
    expect(issued.state).toBe("s1")
    const row = codes.get(issued.code)
    expect(row?.code_challenge).toBe("ch1")
    expect(row?.code_challenge_method).toBe("S256")
  })

  it("exchanges a code when the PKCE verifier and client assertion match", async () => {
    const codes = store()
    const challenge = derivePkceChallenge("verifier-1")
    issueAuthorizationCode(codes, {
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      state: "s1",
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
    })
    const code = codes.keys().next().value as string

    const assertion = signJwt(
      {
        iss: "client-1",
        sub: "client-1",
        aud: "https://esignet.ida.et/v1/esignet/oauth/token",
      },
      clientKeys.privateKeyPem,
      {}
    )

    const result = await exchangeAuthorizationCode(codes, {
      code,
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      codeVerifier: "verifier-1",
      clientAssertion: assertion,
      clientPublicKeyPem: clientKeys.publicKeyPem,
      tokenEndpoint: "https://esignet.ida.et/v1/esignet/oauth/token",
      providerKeys: provider,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.accessToken).toBeTruthy()
      expect(result.idToken).toBeTruthy()
    }
  })

  it("rejects an exchange with the wrong PKCE verifier", async () => {
    const codes = store()
    const challenge = derivePkceChallenge("verifier-1")
    issueAuthorizationCode(codes, {
      clientId: "client-1",
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      state: "s1",
      codeChallenge: challenge,
      codeChallengeMethod: "S256",
    })
    const code = codes.keys().next().value as string
    const assertion = signJwt(
      { iss: "client-1", sub: "client-1", aud: "https://esignet.ida.et/v1/esignet/oauth/token" },
      clientKeys.privateKeyPem,
      {}
    )
    const result = await exchangeAuthorizationCode(codes, {
      code,
      redirectUri: "http://localhost:3000/verify-fayda/callback",
      codeVerifier: "wrong-verifier",
      clientAssertion: assertion,
      clientPublicKeyPem: clientKeys.publicKeyPem,
      tokenEndpoint: "https://esignet.ida.et/v1/esignet/oauth/token",
      providerKeys: provider,
    })
    expect(result.ok).toBe(false)
  })

  it("issues a verify-only userinfo JWT carrying iss/aud/sub (no PII)", () => {
    const issuer = "http://localhost:3000/mock-fayda"
    const clientId = "marketplace-test-client"
    const token = issueUserinfo(provider, issuer, clientId, FAYDA_TEST_SUB)
    const claims = verifyJwt(token, provider.publicKeyPem, {
      issuer,
      audience: clientId,
    })
    expect(claims).not.toBeNull()
    expect(claims!.sub).toBe(FAYDA_TEST_SUB)
    expect(claims!.iss).toBe(issuer)
    expect(claims!.aud).toBe(clientId)
  })
})

describe("fayda.recordFaydaVerification", () => {
  it("records the verification through the RPC", async () => {
    const supabase = {
      rpc: async (name: string, args: Record<string, unknown>) => ({
        data: { ok: true, error: null },
        error: null,
        name,
        args,
      }),
    } as never
    const result = await recordFaydaVerification(supabase, {
      userId: "user-1",
      sub: "fayda-test-0001",
    })
    expect(result.ok).toBe(true)
  })

  it("collapses a transport error into the envelope", async () => {
    const supabase = {
      rpc: async () => ({ data: null, error: { message: "boom" } }),
    } as never
    const result = await recordFaydaVerification(supabase, {
      userId: "user-1",
      sub: "s",
    })
    expect(result).toEqual({ ok: false, error: "boom" })
  })
})

describe("fayda.verifyAndRecord", () => {
  // A provider keypair signs the userinfo JWT (verify-only: sub only).
  const provider = generateKeyPair()
  const issuer = "https://esignet.ida.et"
  const clientId = "marketplace-test-client"

  function signedUserinfo(sub: string): string {
    return signJwt(
      { iss: issuer, sub, aud: clientId },
      provider.privateKeyPem,
      {}
    )
  }
  function fakeSupabase(call: {
    data?: unknown
    error?: { message: string } | null
  } = {}) {
    return {
      rpc: async (name: string, args: Record<string, unknown>) => {
        if (call.error) return { data: null, error: call.error }
        return { data: call.data ?? { ok: true, error: null }, error: null, name, args }
      },
    } as never
  }

  it("records the sub when the JWT is valid", async () => {
    const supabase = fakeSupabase()
    const result = await verifyAndRecord(supabase, "user-1", {
      jws: signedUserinfo("fayda-test-0001"),
      providerPublicKeyPem: provider.publicKeyPem,
      issuer,
      audience: clientId,
    })
    expect(result.ok).toBe(true)
    expect(result.error).toBeNull()
  })

  it("rejects a token signed by a different issuer", async () => {
    const supabase = fakeSupabase()
    const result = await verifyAndRecord(supabase, "user-1", {
      jws: signedUserinfo("fayda-test-0001"),
      providerPublicKeyPem: provider.publicKeyPem,
      issuer: "https://evil.example",
      audience: clientId,
    })
    expect(result).toEqual({ ok: false, error: "token_invalid" })
  })

  it("rejects a token with the wrong audience", async () => {
    const supabase = fakeSupabase()
    const result = await verifyAndRecord(supabase, "user-1", {
      jws: signedUserinfo("fayda-test-0001"),
      providerPublicKeyPem: provider.publicKeyPem,
      issuer,
      audience: "other-client",
    })
    expect(result).toEqual({ ok: false, error: "token_invalid" })
  })

  it("rejects a tampered JWT without calling the RPC", async () => {
    let called = false
    const supabase = {
      rpc: async () => {
        called = true
        return { data: { ok: true }, error: null }
      },
    } as never
    const token = signedUserinfo("fayda-test-0001").slice(0, -4) + "AAAA"
    const result = await verifyAndRecord(supabase, "user-1", {
      jws: token,
      providerPublicKeyPem: provider.publicKeyPem,
      issuer,
      audience: clientId,
    })
    expect(result).toEqual({ ok: false, error: "token_invalid" })
    expect(called).toBe(false)
  })

  it("propagates an RPC transport error", async () => {
    const supabase = fakeSupabase({ error: { message: "boom" } })
    const result = await verifyAndRecord(supabase, "user-1", {
      jws: signedUserinfo("fayda-test-0001"),
      providerPublicKeyPem: provider.publicKeyPem,
      issuer,
      audience: clientId,
    })
    expect(result).toEqual({ ok: false, error: "boom" })
  })
})

describe("fayda.mock constants", () => {
  it("exposes the verify-only scope, test sub and mock kid", () => {
    expect(FAYDA_SCOPE).toBe("openid")
    expect(FAYDA_TEST_SUB).toBe("fayda-test-0001")
    expect(FAYDA_MOCK_KID).toBeTruthy()
  })
})

describe("fayda.client assertion", () => {
  const client = generateKeyPair()
  const tokenEndpoint = "https://esignet.ida.et/v1/esignet/oauth/token"
  const clientId = "marketplace-test-client"

  it("produces an RS256 JWT with iss/sub=client_id, aud=token endpoint", () => {
    const { assertion, assertionType } = buildClientAssertion({
      clientId,
      tokenEndpoint,
      privateKeyPem: client.privateKeyPem,
    })
    expect(assertionType).toBe(
      "urn:ietf:params:oauth:client-assertion-type:jwt-bearer"
    )
    const parsed = parseJwt(assertion)
    expect(parsed?.header.alg).toBe("RS256")
    expect(parsed?.claims.iss).toBe(clientId)
    expect(parsed?.claims.sub).toBe(clientId)
    expect(parsed?.claims.aud).toBe(tokenEndpoint)
    expect(parsed?.claims.iat).toBeTruthy()
    const exp = parsed?.claims.exp
    const iat = parsed?.claims.iat
    expect(exp).toBeTruthy()
    expect(typeof exp).toBe("number")
    expect(exp!).toBeGreaterThan(iat!)
  })

  it("verifies the assertion against the client public key", () => {
    const { assertion } = buildClientAssertion({
      clientId,
      tokenEndpoint,
      privateKeyPem: client.privateKeyPem,
    })
    expect(
      verifyJwt(assertion, client.publicKeyPem, {
        issuer: clientId,
        audience: tokenEndpoint,
      })
    ).not.toBeNull()
  })
})

describe("fayda.dev key singletons", () => {
  it("returns a consistent provider keypair within the process", () => {
    resetDevKeys()
    const a = getProviderKeys()
    const b = getProviderKeys()
    expect(a.publicKeyPem).toBe(b.publicKeyPem)
    const client = getDevClientKeys()
    expect(client.privateKeyPem).not.toBe(a.privateKeyPem)
  })
})

describe("fayda.completeFaydaAuthorization", () => {
  // Provider keypair that signs the userinfo JWT (verify-only: sub only).
  const provider = generateKeyPair()
  const issuer = "https://esignet.ida.et"
  const clientId = "marketplace-test-client"
  const sub = "fayda-test-0001"

  function userinfoJws(): string {
    return signJwt({ iss: issuer, sub, aud: clientId }, provider.privateKeyPem, { kid: "prov" })
  }
  function transport(jws: string) {
    return {
      fetchDiscovery: () =>
        Promise.resolve(
          parseDiscovery({
            issuer,
            authorization_endpoint: `${issuer}/authorize`,
            token_endpoint: `${issuer}/v1/esignet/oauth/token`,
            userinfo_endpoint: `${issuer}/v1/esignet/oidc/userinfo`,
            jwks_uri: `${issuer}/.well-known/jwks.json`,
          })
        ),
      fetchToken: () => Promise.resolve({ accessToken: "at", idToken: "" }),
      fetchUserinfo: () => Promise.resolve(jws),
    }
  }

  it("records the sub on a valid, verified-only userinfo JWT", async () => {
    const captured: { name?: string; args?: Record<string, unknown> } = {}
    const supabase = {
      rpc: async (name: string, args: Record<string, unknown>) => {
        captured.name = name
        captured.args = args
        return { data: { ok: true, error: null }, error: null }
      },
    } as never
    const result = await completeFaydaAuthorization(supabase, "user-1", {
      code: "c",
      state: "s1",
      cookieState: "s1",
      codeVerifier: "verifier",
      cookieCodeChallenge: derivePkceChallenge("verifier"),
      providerPublicKeyPem: provider.publicKeyPem,
      clientId,
      transport: transport(userinfoJws()),
    })
    expect(result.ok).toBe(true)
    expect(captured.name).toBe("record_fayda_verification")
    expect(captured.args?.p_sub).toBe(sub)
    expect(captured.args?.p_user_id).toBe("user-1")
  })

  it("rejects a mismatched state (CSRF) without calling the RPC", async () => {
    let called = false
    const supabase = {
      rpc: async () => {
        called = true
        return { data: { ok: true }, error: null }
      },
    } as never
    const result = await completeFaydaAuthorization(supabase, "user-1", {
      code: "c",
      state: "s1",
      cookieState: "s2",
      codeVerifier: "verifier",
      cookieCodeChallenge: derivePkceChallenge("verifier"),
      providerPublicKeyPem: provider.publicKeyPem,
      clientId,
      transport: transport(userinfoJws()),
    })
    expect(result).toEqual({ ok: false, error: "invalid_state" })
    expect(called).toBe(false)
  })

  it("rejects a PKCE verifier that does not match the stored challenge", async () => {
    let called = false
    const supabase = {
      rpc: async () => {
        called = true
        return { data: { ok: true }, error: null }
      },
    } as never
    const result = await completeFaydaAuthorization(supabase, "user-1", {
      code: "c",
      state: "s1",
      cookieState: "s1",
      codeVerifier: "verifier",
      cookieCodeChallenge: derivePkceChallenge("different-verifier"),
      providerPublicKeyPem: provider.publicKeyPem,
      clientId,
      transport: transport(userinfoJws()),
    })
    expect(result).toEqual({ ok: false, error: "invalid_grant" })
    expect(called).toBe(false)
  })

  it("rejects a userinfo JWT signed by an unexpected key", async () => {
    const other = generateKeyPair()
    const supabase = {
      rpc: async () => ({ data: { ok: true }, error: null }),
    } as never
    const result = await completeFaydaAuthorization(supabase, "user-1", {
      code: "c",
      state: "s1",
      cookieState: "s1",
      codeVerifier: "verifier",
      cookieCodeChallenge: derivePkceChallenge("verifier"),
      providerPublicKeyPem: other.publicKeyPem,
      clientId,
      transport: transport(userinfoJws()),
    })
    expect(result).toEqual({ ok: false, error: "token_invalid" })
  })
})
