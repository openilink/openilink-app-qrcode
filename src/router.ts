/**
 * 命令路由器
 */

import type { HubEvent, ToolDefinition, ToolHandler, ToolContext } from "./hub/types.js";
import type { HubClient } from "./hub/client.js";
import type { Store } from "./store.js";

export interface RouterOptions {
  definitions: ToolDefinition[];
  handlers: Map<string, ToolHandler>;
  store: Store;
}

export class Router {
  private definitions: ToolDefinition[];
  private handlers: Map<string, ToolHandler>;
  private store: Store;

  constructor(opts: RouterOptions) {
    this.definitions = opts.definitions;
    this.handlers = opts.handlers;
    this.store = opts.store;
  }

  getDefinitions(): ToolDefinition[] { return this.definitions; }

  async handleCommand(event: HubEvent): Promise<string | undefined> {
    if (event.type !== "event" || !event.event || event.event.type !== "command") return undefined;

    const eventData = event.event.data;
    const command = (eventData.command as string) || "";
    const args = (eventData.args as Record<string, unknown>) || {};

    const handler = this.handlers.get(command);
    if (!handler) {
      return `未知命令：${command}。可用命令：${this.definitions.map((d) => d.command).join("、")}`;
    }

    const ctx: ToolContext = {
      installationId: event.installation_id,
      botId: event.bot.id,
      userId: (eventData.user_id as string) || "",
      traceId: event.trace_id,
      args,
    };

    try {
      return await handler(ctx);
    } catch (err: any) {
      console.error(`[Router] 命令 ${command} 执行异常:`, err);
      return `命令执行失败：${err.message || "未知错误"}`;
    }
  }

  async handleAndReply(event: HubEvent, hubClient: HubClient): Promise<void> {
    const result = await this.handleCommand(event);
    if (result === undefined) return;
    try { await hubClient.replyToolResult(event.trace_id, result); }
    catch (err) { console.error("[Router] 回传工具结果失败:", err); }
  }
}
