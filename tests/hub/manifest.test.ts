/**
 * 应用清单测试
 */
import { describe, it, expect } from "vitest";
import { manifest } from "../../src/hub/manifest.js";

describe("manifest", () => {
  it("slug 为 qrcode", () => { expect(manifest.slug).toBe("qrcode"); });
  it("名称为二维码工具", () => { expect(manifest.name).toBe("二维码工具"); });
  it("包含图标", () => { expect(manifest.icon).toBeTruthy(); });
  it("包含描述", () => { expect(manifest.description).toContain("二维码"); });
  it("订阅了 command 事件", () => { expect(manifest.events).toContain("command"); });
  it("events 是字符串数组", () => {
    expect(Array.isArray(manifest.events)).toBe(true);
    for (const e of manifest.events) expect(typeof e).toBe("string");
  });
});
