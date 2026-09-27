import { describe, it, expect } from "vitest"
import { Buffer } from "node:buffer"
import { tokenAal, verifiedTotp, needsSecondStep } from "./mfa"

const b64url = (obj) => Buffer.from(JSON.stringify(obj)).toString("base64url")
const token = (claims) => `${b64url({ alg: "HS256" })}.${b64url(claims)}.sig`
const withFactor = (status) => ({ factors: [{ id: "f1", factor_type: "totp", status }] })

describe("mfa", () => {
  it("tokenAal lee el nivel del token (también con caracteres base64url); si no se puede, null", () => {
    expect(tokenAal(token({ sub: "u", aal: "aal2", name: "ñandú??>>" }))).toBe("aal2")
    expect(tokenAal(token({ sub: "u" }))).toBeNull()
    expect(tokenAal("no-es-un-jwt")).toBeNull()
    expect(tokenAal(null)).toBeNull()
  })

  it("solo un factor TOTP verificado cuenta como verificación en dos pasos activa", () => {
    expect(verifiedTotp(withFactor("verified"))?.id).toBe("f1")
    expect(verifiedTotp(withFactor("unverified"))).toBeNull()
    expect(verifiedTotp({ factors: [{ id: "p", factor_type: "phone", status: "verified" }] })).toBeNull()
    expect(verifiedTotp(null)).toBeNull()
  })

  it("con un factor verificado, falta el segundo paso hasta que el token sea aal2", () => {
    expect(needsSecondStep(withFactor("verified"), token({ aal: "aal1" }))).toBe(true)
    expect(needsSecondStep(withFactor("verified"), token({ aal: "aal2" }))).toBe(false)
    expect(needsSecondStep(withFactor("unverified"), token({ aal: "aal1" }))).toBe(false)
    expect(needsSecondStep({}, token({ aal: "aal1" }))).toBe(false)
  })
})
