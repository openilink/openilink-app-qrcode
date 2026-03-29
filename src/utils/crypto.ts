/**
 * 加密工具：HMAC 签名验证 + PKCE 码生成
 */

import { createHmac, randomBytes, createHash, timingSafeEqual } from "node:crypto";

export function verifySignature(
  payload: string | Buffer, signature: string, secret: string,
): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha256", secret).update(payload).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf-8"), Buffer.from(signature, "utf-8"));
}

export interface PKCEPair {
  codeVerifier: string;
  codeChallenge: string;
}

export function generatePKCE(): PKCEPair {
  const codeVerifier = randomBytes(32).toString("base64url");
  const codeChallenge = createHash("sha256").update(codeVerifier).digest("base64url");
  return { codeVerifier, codeChallenge };
}
