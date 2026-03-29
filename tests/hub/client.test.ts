/**
 * HubClient 测试
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { HubClient } from "../../src/hub/client.js";

describe("HubClient", () => {
  const hubUrl = "https://hub.example.com";
  const appToken = "test-token";
  let client: HubClient;
  const originalFetch = globalThis.fetch;

  beforeEach(() => { client = new HubClient(hubUrl, appToken); });
  afterEach(() => { globalThis.fetch = originalFetch; });

  it("去除末尾斜杠", () => {
    const c = new HubClient("https://hub.example.com///", appToken);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ ok: true, data: { messageId: "m1" } }),
    });
    c.sendMessage({ userId: "u1", text: "hi" });
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      "https://hub.example.com/api/bot/message", expect.any(Object),
    );
  });

  it("sendMessage 正确请求", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ ok: true, data: { messageId: "m1" } }),
    });
    const result = await client.sendMessage({ userId: "u1", text: "test", traceId: "t1" });
    expect(result).toEqual({ messageId: "m1" });
  });

  it("replyToolResult 正确请求", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ ok: true }),
    });
    await client.replyToolResult("t1", "ok");
    const body = JSON.parse((vi.mocked(globalThis.fetch).mock.calls[0][1] as any).body);
    expect(body.trace_id).toBe("t1");
    expect(body.result).toBe("ok");
  });

  it("HTTP 错误抛异常", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false, status: 500, text: () => Promise.resolve("Error"),
    });
    await expect(client.sendMessage({ userId: "u1", text: "hi" })).rejects.toThrow("Hub API 请求失败");
  });

  it("业务错误抛异常", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true, headers: new Headers({ "content-type": "application/json" }),
      json: () => Promise.resolve({ ok: false, error: "fail" }),
    });
    await expect(client.sendMessage({ userId: "u1", text: "hi" })).rejects.toThrow("fail");
  });

  it("registerTools PUT 请求", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true, headers: new Headers() });
    await client.registerTools([{ name: "gen", description: "生成", command: "gen" }]);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledWith(
      `${hubUrl}/api/bot/tools`, expect.objectContaining({ method: "PUT" }),
    );
  });
});
