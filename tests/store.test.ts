/**
 * Store 持久化层测试
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Store } from "../src/store.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("Store", () => {
  let store: Store;
  let dbPath: string;

  beforeEach(() => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "qrcode-store-test-"));
    dbPath = path.join(tmpDir, "test.db");
    store = new Store(dbPath);
  });

  afterEach(() => {
    store.close();
    const dir = path.dirname(dbPath);
    if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
  });

  it("保存并读取安装记录", () => {
    store.saveInstallation({
      id: "inst-001", hubUrl: "https://hub.test", appId: "a1",
      botId: "b1", appToken: "t1", webhookSecret: "s1",
    });
    const r = store.getInstallation("inst-001");
    expect(r).toBeDefined();
    expect(r!.id).toBe("inst-001");
  });

  it("不存在的记录返回 undefined", () => {
    expect(store.getInstallation("none")).toBeUndefined();
  });

  it("更新安装记录", () => {
    store.saveInstallation({
      id: "inst-001", hubUrl: "https://hub.test", appId: "a1",
      botId: "b1", appToken: "old", webhookSecret: "old",
    });
    store.saveInstallation({
      id: "inst-001", hubUrl: "https://hub.test", appId: "a1",
      botId: "b1", appToken: "new", webhookSecret: "new",
    });
    expect(store.getInstallation("inst-001")!.appToken).toBe("new");
  });

  it("获取所有安装记录", () => {
    store.saveInstallation({ id: "i1", hubUrl: "h", appId: "a", botId: "b", appToken: "t", webhookSecret: "s" });
    store.saveInstallation({ id: "i2", hubUrl: "h", appId: "a", botId: "b", appToken: "t", webhookSecret: "s" });
    expect(store.getAllInstallations()).toHaveLength(2);
  });

  it("空数据库返回空数组", () => {
    expect(store.getAllInstallations()).toEqual([]);
  });
});
