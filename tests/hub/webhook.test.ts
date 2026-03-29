/**
 * Webhook 处理器测试
 */
import { describe, it, expect, vi } from "vitest";
import { createHmac } from "node:crypto";
import { handleWebhook, type EventHandler } from "../../src/hub/webhook.js";
import type { IncomingMessage, ServerResponse } from "node:http";
import { EventEmitter } from "node:events";

function mockRequest(method: string, body: string, headers: Record<string, string> = {}): IncomingMessage {
  const em = new EventEmitter() as any;
  em.method = method; em.url = "/hub/webhook"; em.headers = headers;
  process.nextTick(() => { em.emit("data", Buffer.from(body)); em.emit("end"); });
  return em as IncomingMessage;
}

function mockResponse(): ServerResponse & { _statusCode: number; _body: string } {
  const r = {
    _statusCode: 0, _body: "", _headers: {} as any, headersSent: false,
    writeHead(s: number, h?: any) { r._statusCode = s; if (h) Object.assign(r._headers, h); return r; },
    end(b?: string) { r._body = b || ""; r.headersSent = true; },
  };
  return r as any;
}

function sign(p: string, s: string) { return createHmac("sha256", s).update(p).digest("hex"); }

function mockStore(insts: Record<string, any> = {}) {
  return {
    getInstallation: vi.fn((id: string) => insts[id]),
    saveInstallation: vi.fn(), getAllInstallations: vi.fn(() => Object.values(insts)), close: vi.fn(),
  } as any;
}

describe("handleWebhook", () => {
  const secret = "test-secret";
  const instId = "inst-001";
  const insts = {
    [instId]: { id: instId, hubUrl: "https://hub.test", appId: "a", botId: "b", appToken: "t", webhookSecret: secret },
  };

  it("拒绝非 POST（405）", async () => {
    const res = mockResponse();
    await handleWebhook(mockRequest("GET", ""), res, { store: mockStore(insts) });
    expect(res._statusCode).toBe(405);
  });

  it("无效 JSON（400）", async () => {
    const res = mockResponse();
    await handleWebhook(mockRequest("POST", "{bad"), res, { store: mockStore(insts) });
    expect(res._statusCode).toBe(400);
  });

  it("未知安装实例（404）", async () => {
    const body = JSON.stringify({ type: "event", installation_id: "x", trace_id: "t", bot: { id: "b" } });
    const res = mockResponse();
    await handleWebhook(mockRequest("POST", body), res, { store: mockStore(insts) });
    expect(res._statusCode).toBe(404);
  });

  it("签名失败（401）", async () => {
    const body = JSON.stringify({ type: "event", installation_id: instId, trace_id: "t", bot: { id: "b" } });
    const res = mockResponse();
    await handleWebhook(mockRequest("POST", body, { "x-hub-signature": "bad" }), res, { store: mockStore(insts) });
    expect(res._statusCode).toBe(401);
  });

  it("challenge 握手", async () => {
    const body = JSON.stringify({ type: "challenge", installation_id: instId, challenge: "val", trace_id: "t", bot: { id: "b" } });
    const res = mockResponse();
    await handleWebhook(mockRequest("POST", body, { "x-hub-signature": sign(body, secret) }), res, { store: mockStore(insts) });
    expect(res._statusCode).toBe(200);
    expect(JSON.parse(res._body).challenge).toBe("val");
  });

  it("分发事件（200）", async () => {
    const onEvent = vi.fn<EventHandler>();
    const body = JSON.stringify({
      type: "event", installation_id: instId, trace_id: "t", bot: { id: "b" },
      event: { type: "command", id: "e1", timestamp: "2025-01-01T00:00:00Z", data: { command: "gen" } },
    });
    const res = mockResponse();
    await handleWebhook(mockRequest("POST", body, { "x-hub-signature": sign(body, secret) }), res, { store: mockStore(insts), onEvent });
    expect(res._statusCode).toBe(200);
    expect(onEvent).toHaveBeenCalledOnce();
  });
});
