/**
 * 配置模块测试
 */
import { describe, it, expect } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  const validEnv = {
    HUB_URL: "https://hub.example.com",
    BASE_URL: "https://app.example.com",
  };

  it("使用默认端口 8093", () => {
    expect(loadConfig(validEnv).port).toBe("8093");
  });

  it("可以通过 PORT 覆盖默认端口", () => {
    expect(loadConfig({ ...validEnv, PORT: "3000" }).port).toBe("3000");
  });

  it("使用默认数据库路径 data/qrcode.db", () => {
    expect(loadConfig(validEnv).dbPath).toBe("data/qrcode.db");
  });

  it("缺少 HUB_URL 时抛出异常", () => {
    expect(() => loadConfig({ BASE_URL: "https://app.test" })).toThrow("HUB_URL");
  });

  it("缺少 BASE_URL 时抛出异常", () => {
    expect(() => loadConfig({ HUB_URL: "https://hub.test" })).toThrow("BASE_URL");
  });

  it("正确加载所有配置项", () => {
    expect(loadConfig({
      PORT: "9090", HUB_URL: "https://hub.test",
      BASE_URL: "https://app.test", DB_PATH: "/data/my.db",
    })).toEqual({
      port: "9090", hubUrl: "https://hub.test",
      baseUrl: "https://app.test", dbPath: "/data/my.db",
    });
  });
});
