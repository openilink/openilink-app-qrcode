/**
 * OAuth PKCE 授权流程处理
 */

import { generatePKCE } from "../utils/crypto.js";
import type { Store } from "../store.js";
import type { Config } from "../config.js";
import type { Installation } from "./types.js";
import type { IncomingMessage, ServerResponse } from "node:http";

const pendingStates = new Map<string, { codeVerifier: string; createdAt: number }>();
const STATE_TTL_MS = 5 * 60 * 1000;

export interface OAuthOptions {
  config: Config;
  store: Store;
}

export function handleOAuthStart(
  _req: IncomingMessage, res: ServerResponse, opts: OAuthOptions,
): void {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomUUID();
  pendingStates.set(state, { codeVerifier, createdAt: Date.now() });
  cleanupExpiredStates();

  const redirectUrl = new URL("/oauth/authorize", opts.config.hubUrl);
  redirectUrl.searchParams.set("response_type", "code");
  redirectUrl.searchParams.set("redirect_uri", `${opts.config.baseUrl}/oauth/redirect`);
  redirectUrl.searchParams.set("state", state);
  redirectUrl.searchParams.set("code_challenge", codeChallenge);
  redirectUrl.searchParams.set("code_challenge_method", "S256");

  res.writeHead(302, { Location: redirectUrl.toString() });
  res.end();
}

export async function handleOAuthCallback(
  req: IncomingMessage, res: ServerResponse, opts: OAuthOptions,
): Promise<void> {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "缺少 code 或 state 参数" }));
    return;
  }

  const pending = pendingStates.get(state);
  if (!pending) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "state 无效或已过期" }));
    return;
  }
  pendingStates.delete(state);

  try {
    const tokenUrl = new URL("/oauth/token", opts.config.hubUrl);
    const tokenResp = await fetch(tokenUrl.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code", code,
        redirect_uri: `${opts.config.baseUrl}/oauth/redirect`,
        code_verifier: pending.codeVerifier,
      }),
    });

    if (!tokenResp.ok) {
      const errText = await tokenResp.text();
      res.writeHead(502, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "换取 token 失败", detail: errText }));
      return;
    }

    const tokenData = (await tokenResp.json()) as {
      installation_id: string; app_id: string; bot_id: string;
      app_token: string; webhook_secret: string;
    };

    const installation: Installation = {
      id: tokenData.installation_id, hubUrl: opts.config.hubUrl,
      appId: tokenData.app_id, botId: tokenData.bot_id,
      appToken: tokenData.app_token, webhookSecret: tokenData.webhook_secret,
      createdAt: new Date().toISOString(),
    };
    opts.store.saveInstallation(installation);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, installation_id: installation.id }));
  } catch (err) {
    console.error("[oauth] 回调处理异常:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "内部错误" }));
  }
}

function cleanupExpiredStates(): void {
  const now = Date.now();
  for (const [key, value] of pendingStates) {
    if (now - value.createdAt > STATE_TTL_MS) pendingStates.delete(key);
  }
}
