/**
 * Router 命令路由器测试
 */
import { describe, it, expect, vi } from "vitest";
import { Router } from "../src/router.js";
import type { HubEvent, ToolDefinition, ToolHandler } from "../src/hub/types.js";

function mockStore() {
  return { getInstallation: vi.fn(), saveInstallation: vi.fn(), getAllInstallations: vi.fn(), close: vi.fn() } as any;
}

function createTestTools() {
  const definitions: ToolDefinition[] = [
    { name: "generate_qrcode", description: "生成", command: "generate_qrcode" },
    { name: "decode_qrcode", description: "解码", command: "decode_qrcode" },
  ];
  const handlers = new Map<string, ToolHandler>();
  handlers.set("generate_qrcode", vi.fn().mockResolvedValue("二维码已生成"));
  handlers.set("decode_qrcode", vi.fn().mockResolvedValue("二维码内容: hello"));
  return { definitions, handlers };
}

function makeCommandEvent(command: string, args: Record<string, unknown> = {}): HubEvent {
  return {
    v: "1", type: "event", trace_id: "trace-001", installation_id: "inst-001", bot: { id: "bot-001" },
    event: { type: "command", id: "evt-001", timestamp: "2025-01-01T00:00:00Z", data: { command, args, user_id: "user-001" } },
  };
}

describe("Router", () => {
  it("正确路由", async () => {
    const { definitions, handlers } = createTestTools();
    const router = new Router({ definitions, handlers, store: mockStore() });
    expect(await router.handleCommand(makeCommandEvent("generate_qrcode", { text: "hello" }))).toBe("二维码已生成");
  });

  it("传递 ToolContext", async () => {
    const { definitions, handlers } = createTestTools();
    const router = new Router({ definitions, handlers, store: mockStore() });
    await router.handleCommand(makeCommandEvent("generate_qrcode", { text: "x" }));
    const ctx = (handlers.get("generate_qrcode") as any).mock.calls[0][0];
    expect(ctx.installationId).toBe("inst-001");
    expect(ctx.args).toEqual({ text: "x" });
  });

  it("未知命令", async () => {
    const { definitions, handlers } = createTestTools();
    const router = new Router({ definitions, handlers, store: mockStore() });
    expect(await router.handleCommand(makeCommandEvent("unknown"))).toContain("未知命令");
  });

  it("非 event 返回 undefined", async () => {
    const { definitions, handlers } = createTestTools();
    const router = new Router({ definitions, handlers, store: mockStore() });
    expect(await router.handleCommand({ v: "1", type: "challenge", trace_id: "t", installation_id: "i", bot: { id: "b" } })).toBeUndefined();
  });

  it("异常时返回错误", async () => {
    const defs: ToolDefinition[] = [{ name: "bad", description: "坏的", command: "bad" }];
    const h = new Map<string, ToolHandler>();
    h.set("bad", vi.fn().mockRejectedValue(new Error("boom")));
    const router = new Router({ definitions: defs, handlers: h, store: mockStore() });
    expect(await router.handleCommand(makeCommandEvent("bad"))).toContain("命令执行失败");
  });

  it("getDefinitions", () => {
    const { definitions, handlers } = createTestTools();
    expect(new Router({ definitions, handlers, store: mockStore() }).getDefinitions()).toHaveLength(2);
  });

  it("handleAndReply", async () => {
    const { definitions, handlers } = createTestTools();
    const router = new Router({ definitions, handlers, store: mockStore() });
    const hub = { replyToolResult: vi.fn().mockResolvedValue(undefined) } as any;
    await router.handleAndReply(makeCommandEvent("generate_qrcode"), hub);
    expect(hub.replyToolResult).toHaveBeenCalledWith("trace-001", "二维码已生成");
  });
});
