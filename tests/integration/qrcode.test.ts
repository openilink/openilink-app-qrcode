/**
 * 二维码工具集成测试
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import http from "node:http";
import crypto from "node:crypto";
import { Store } from "../../src/store.js";
import { handleWebhook } from "../../src/hub/webhook.js";
import { collectAllTools } from "../../src/tools/index.js";
import { Router } from "../../src/router.js";
import { HubClient } from "../../src/hub/client.js";
import type { HubEvent } from "../../src/hub/types.js";

const MOCK_HUB_PORT = 9861;
const APP_PORT = 9862;
const MOCK_HUB_URL = `http://localhost:${MOCK_HUB_PORT}`;
const WEBHOOK_SECRET = "int-test-secret";
const APP_TOKEN = "int-test-token";
const INSTALLATION_ID = "int-inst-001";

let toolResults: any[] = [];

describe("二维码工具集成测试", () => {
  let mockHubServer: http.Server;
  let appServer: http.Server;
  let store: Store;
  const originalFetch = globalThis.fetch;

  beforeAll(async () => {
    // Mock Hub Server
    mockHubServer = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${MOCK_HUB_PORT}`);
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks).toString();

      if (req.method === "POST" && url.pathname === "/api/bot/tool-result") {
        toolResults.push(JSON.parse(body));
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
        return;
      }
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
    });

    await new Promise<void>((resolve, reject) => {
      mockHubServer.on("error", reject);
      mockHubServer.listen(MOCK_HUB_PORT, resolve);
    });

    // Store + Router
    store = new Store(":memory:");
    store.saveInstallation({
      id: INSTALLATION_ID, hubUrl: MOCK_HUB_URL, appId: "test-app",
      botId: "test-bot", appToken: APP_TOKEN, webhookSecret: WEBHOOK_SECRET,
      createdAt: new Date().toISOString(),
    });

    const { definitions, handlers } = collectAllTools();
    const router = new Router({ definitions, handlers, store });

    // App Server
    appServer = http.createServer(async (req, res) => {
      const url = new URL(req.url!, `http://localhost:${APP_PORT}`);
      if (url.pathname === "/hub/webhook") {
        await handleWebhook(req, res, {
          store,
          onEvent: async (event: HubEvent) => {
            if (!event.event || event.event.type !== "command") return;
            const inst = store.getInstallation(event.installation_id);
            if (!inst) return;
            const hubClient = new HubClient(inst.hubUrl, inst.appToken);
            await router.handleAndReply(event, hubClient);
          },
        });
        return;
      }
      if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
        return;
      }
      res.writeHead(404);
      res.end("Not Found");
    });

    await new Promise<void>((resolve, reject) => {
      appServer.on("error", reject);
      appServer.listen(APP_PORT, resolve);
    });
  });

  afterAll(async () => {
    globalThis.fetch = originalFetch;
    await new Promise<void>((r) => appServer.close(() => r()));
    await new Promise<void>((r) => mockHubServer.close(() => r()));
    store.close();
  });

  beforeEach(() => { toolResults = []; });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it("Mock Hub 健康检查", async () => {
    const res = await originalFetch(`${MOCK_HUB_URL}/health`);
    expect(res.ok).toBe(true);
  });

  it("App Server 健康检查", async () => {
    const res = await originalFetch(`http://localhost:${APP_PORT}/health`);
    expect(res.ok).toBe(true);
  });

  it("challenge 握手", async () => {
    const ev = {
      v: "1", type: "challenge", challenge: "test_val",
      trace_id: "t1", installation_id: INSTALLATION_ID, bot: { id: "b" },
    };
    const body = JSON.stringify(ev);
    const sig = crypto.createHmac("sha256", WEBHOOK_SECRET).update(body).digest("hex");
    const res = await originalFetch(`http://localhost:${APP_PORT}/hub/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hub-Signature": sig },
      body,
    });
    expect(res.ok).toBe(true);
    expect((await res.json() as any).challenge).toBe("test_val");
  });

  it("无效签名被拒绝（401）", async () => {
    const ev = {
      v: "1", type: "event", trace_id: "t1", installation_id: INSTALLATION_ID, bot: { id: "b" },
      event: { type: "command", id: "e1", timestamp: new Date().toISOString(), data: { command: "generate_qrcode" } },
    };
    const res = await originalFetch(`http://localhost:${APP_PORT}/hub/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Hub-Signature": "bad" },
      body: JSON.stringify(ev),
    });
    expect(res.status).toBe(401);
  });

  it("非 POST 被拒绝（405）", async () => {
    const res = await originalFetch(`http://localhost:${APP_PORT}/hub/webhook`, { method: "GET" });
    expect(res.status).toBe(405);
  });
});
