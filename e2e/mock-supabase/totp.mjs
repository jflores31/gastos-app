// TOTP (RFC 6238: HMAC-SHA1, 30 s steps, 6 digits), as authenticator apps compute it. The
// mock checks codes with it and the e2e tests compute them from the key shown on screen.
import { createHmac, randomBytes } from "node:crypto"

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"

export function randomSecret(bytes = 20) {
  let bits = ""
  for (const b of randomBytes(bytes)) bits += b.toString(2).padStart(8, "0")
  return bits.match(/.{1,5}/g).map((chunk) => ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)]).join("")
}

function base32Decode(secret) {
  let bits = ""
  for (const ch of secret.replace(/=+$/, "").toUpperCase()) bits += ALPHABET.indexOf(ch).toString(2).padStart(5, "0")
  return Buffer.from(bits.match(/.{8}/g).map((byte) => parseInt(byte, 2)))
}

export function totp(secret, time = Date.now(), step = 30) {
  const counter = Buffer.alloc(8)
  counter.writeBigUInt64BE(BigInt(Math.floor(time / 1000 / step)))
  const hmac = createHmac("sha1", base32Decode(secret)).update(counter).digest()
  const offset = hmac[hmac.length - 1] & 0xf
  const n = (hmac.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
  return String(n).padStart(6, "0")
}

// Accepts the current code and the previous one (clocks drift; Supabase does the same).
export const totpMatches = (secret, code, time = Date.now()) =>
  [time, time - 30_000].some((t) => totp(secret, t) === String(code))
