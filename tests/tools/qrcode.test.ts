/**
 * 二维码工具测试 — generate_qrcode / decode_qrcode
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { qrcodeTools, generateQRCode, decodeQRCode } from "../../src/tools/qrcode.js";
import type { ToolContext } from "../../src/hub/types.js";
import QRCode from "qrcode";
import { Jimp } from "jimp";

function makeCtx(args: Record<string, unknown>): ToolContext {
  return { installationId: "inst-001", botId: "bot-001", userId: "user-001", traceId: "trace-001", args };
}

const originalFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = originalFetch; });

describe("qrcodeTools", () => {
  it("定义了 2 个工具", () => {
    expect(qrcodeTools.definitions).toHaveLength(2);
    expect(qrcodeTools.definitions.map((d) => d.name)).toEqual([
      "generate_qrcode", "decode_qrcode",
    ]);
  });

  describe("generate_qrcode", () => {
    it("成功生成二维码并返回 data URL", async () => {
      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("generate_qrcode")!;
      const result = await handler(makeCtx({ text: "https://example.com" }));

      expect(result).toContain("二维码已生成");
      expect(result).toContain("https://example.com");
      expect(result).toContain("data:image/png;base64,");
    });

    it("支持自定义尺寸", async () => {
      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("generate_qrcode")!;
      const result = await handler(makeCtx({ text: "test", size: 500 }));
      expect(result).toContain("二维码已生成");
    });

    it("缺少 text 参数返回错误", async () => {
      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("generate_qrcode")!;
      const result = await handler(makeCtx({}));
      expect(result).toContain("错误");
      expect(result).toContain("text");
    });
  });

  describe("decode_qrcode", () => {
    it("成功解码二维码图片", async () => {
      // 先生成一个二维码 PNG
      const testText = "Hello QR Code!";
      const pngBuffer = await QRCode.toBuffer(testText, { width: 300 });

      // Mock fetch 返回生成的 PNG
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(pngBuffer.buffer.slice(
          pngBuffer.byteOffset,
          pngBuffer.byteOffset + pngBuffer.byteLength,
        )),
      });

      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("decode_qrcode")!;
      const result = await handler(makeCtx({ image_url: "https://example.com/qr.png" }));

      expect(result).toContain("二维码内容");
      expect(result).toContain(testText);
    });

    it("缺少 image_url 参数返回错误", async () => {
      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("decode_qrcode")!;
      const result = await handler(makeCtx({}));
      expect(result).toContain("错误");
      expect(result).toContain("image_url");
    });

    it("下载失败时返回错误", async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false, status: 404,
      });

      const handlers = qrcodeTools.createHandlers();
      const handler = handlers.get("decode_qrcode")!;
      const result = await handler(makeCtx({ image_url: "https://example.com/bad.png" }));
      expect(result).toContain("解码二维码失败");
    });
  });

  describe("generateQRCode 独立函数", () => {
    it("返回 base64 data URL", async () => {
      const url = await generateQRCode("test");
      expect(url).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe("decodeQRCode 独立函数", () => {
    it("正确解码生成的二维码", async () => {
      const testContent = "测试内容 123";
      const pngBuffer = await QRCode.toBuffer(testContent, { width: 300 });

      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(pngBuffer.buffer.slice(
          pngBuffer.byteOffset,
          pngBuffer.byteOffset + pngBuffer.byteLength,
        )),
      });

      const decoded = await decodeQRCode("https://example.com/qr.png");
      expect(decoded).toBe(testContent);
    });
  });
});
