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

    // 构建执行上下文: userId 从 sender.id 取得
    const ctx: ToolContext = {
      installationId: event.installation_id,
      botId: event.bot.id,
      userId: eventData.sender?.id ?? "",
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

  /** 完整处理流程：执行命令并通过 HubClient 异步推送结果 */
  async handleAndReply(event: HubEvent, hubClient: HubClient): Promise<void> {
    const result = await this.handleCommand(event);
    if (result === undefined) return;

    // 异步推送: to = data.group?.id ?? data.sender?.id
    const data = event.event?.data;
    const to = data?.group?.id ?? data?.sender?.id ?? "";
    if (to) {
      try {
        await hubClient.sendText(to, result, event.trace_id);
      } catch (err) {
        console.error("[Router] 回传工具结果失败:", err);
      }
    }
  }
}
