/**
 * Webhook 事件接收与分发
 */

import { verifySignature } from "../utils/crypto.js";
import type { Store } from "../store.js";
import type { HubEvent } from "./types.js";
import type { IncomingMessage, ServerResponse } from "node:http";

export type EventHandler = (event: HubEvent) => Promise<void>;

export interface WebhookOptions {
  store: Store;
  onEvent?: EventHandler;
}

export async function handleWebhook(
  req: IncomingMessage, res: ServerResponse, opts: WebhookOptions,
): Promise<void> {
  if (req.method !== "POST") {
    res.writeHead(405, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "仅支持 POST 请求" }));
    return;
  }

  const body = await readBody(req);
  if (!body) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "请求体为空" }));
    return;
  }

  let event: HubEvent;
  try { event = JSON.parse(body) as HubEvent; } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "JSON 解析失败" }));
    return;
  }

  const installation = opts.store.getInstallation(event.installation_id);
  if (!installation) {
    console.warn("[webhook] 未知安装实例:", event.installation_id);
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "未知的安装实例" }));
    return;
  }

  const signature = req.headers["x-hub-signature"] as string | undefined;
  if (!signature || !verifySignature(body, signature, installation.webhookSecret)) {
    console.warn("[webhook] 签名验证失败:", event.installation_id);
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "签名验证失败" }));
    return;
  }

  if (event.type === "challenge" && event.challenge) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ challenge: event.challenge }));
    return;
  }

  if (event.type === "event" && opts.onEvent) {
    try { await opts.onEvent(event); } catch (err) {
      console.error("[webhook] 事件处理失败:", err);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "事件处理失败" }));
      return;
    }
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true }));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}
