/**
 * 工具注册中心 — 汇总所有二维码工具模块
 */

import type { ToolDefinition, ToolHandler } from "../hub/types.js";
import { qrcodeTools } from "./qrcode.js";

const allModules = [qrcodeTools];

/**
 * 收集所有工具定义和处理函数
 */
export function collectAllTools(): {
  definitions: ToolDefinition[];
  handlers: Map<string, ToolHandler>;
} {
  const definitions: ToolDefinition[] = [];
  const handlers = new Map<string, ToolHandler>();

  for (const mod of allModules) {
    definitions.push(...mod.definitions);
    const moduleHandlers = mod.createHandlers();
    for (const [name, handler] of moduleHandlers) {
      handlers.set(name, handler);
    }
  }

  return { definitions, handlers };
}
