import crypto from "node:crypto";

/**
 * AES-256-GCM token encryption used to persist provider tokens
 * (Google access + refresh tokens) at rest in the database.
 *
 * The key MUST be provided via TOKEN_ENCRYPTION_KEY (32-byte hex).
 * Encrypted payload format: `${ivHex}:${tagHex}:${cipherHex}`.
 *
 * NOTE: This module is server-only. Do NOT import it from a client
 * component — webpack will refuse to bundle `node:crypto` in the
 * browser, which is the intended behavior.
 */

const ALGO = "aes-256-gcm";
const IV_LENGTH = 12;
const KEY_LENGTH = 32;

function getKey(): Buffer {
  const hex = process.env.TOKEN_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY is not set. Generate one with " +
        "`node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"`.",
    );
  }
  const key = Buffer.from(hex, "hex");
  if (key.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes (got ${key.length}).`,
    );
  }
  return key;
}

export function encryptToken(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${enc.toString("hex")}`;
}

export function decryptToken(payload: string): string {
  const parts = payload.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token payload.");
  }
  const [ivHex, tagHex, cipherHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const tag = Buffer.from(tagHex, "hex");
  const cipher = Buffer.from(cipherHex, "hex");
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(cipher), decipher.final()]);
  return dec.toString("utf8");
}
