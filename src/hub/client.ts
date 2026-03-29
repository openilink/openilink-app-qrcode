/**
 * Hub Bot API 客户端
 */

import type { ToolDefinition } from "./types.js";

interface HubResponse<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface SendMessageParams {
  userId: string;
  text: string;
  traceId?: string;
}

export interface SendMessageResult {
  messageId: string;
}

export class HubClient {
  private hubUrl: string;
  private appToken: string;

  constructor(hubUrl: string, appToken: string) {
    this.hubUrl = hubUrl.replace(/\/+$/, "");
    this.appToken = appToken;
  }

  async sendMessage(params: SendMessageParams): Promise<SendMessageResult> {
    return await this.request<SendMessageResult>("/api/bot/message", {
      method: "POST",
      body: { user_id: params.userId, text: params.text, trace_id: params.traceId },
    });
  }

  async sendTyping(userId: string): Promise<void> {
    await this.request("/api/bot/typing", { method: "POST", body: { user_id: userId } });
  }

  async replyToolResult(traceId: string, result: string): Promise<void> {
    await this.request("/api/bot/tool-result", {
      method: "POST",
      body: { trace_id: traceId, result },
    });
  }

  /**
   * 同步工具定义到 Hub（PUT /bot/v1/app/tools）
   */
  async syncTools(tools: ToolDefinition[]): Promise<void> {
    const url = `${this.hubUrl}/bot/v1/app/tools`;
    const resp = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.appToken}`,
      },
      body: JSON.stringify({ tools }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`syncTools 失败 [${resp.status}]: ${errText}`);
    }
    console.log("[hub-client] syncTools 成功");
  }

  private async request<T = unknown>(
    path: string,
    opts: { method: string; body?: unknown },
  ): Promise<T> {
    const url = `${this.hubUrl}${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.appToken}`,
    };

    const resp = await fetch(url, {
      method: opts.method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Hub API 请求失败 [${resp.status}] ${path}: ${errText}`);
    }

    const contentType = resp.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return undefined as T;
    }

    const json = (await resp.json()) as HubResponse<T>;
    if (!json.ok) {
      throw new Error(`Hub API 业务错误 ${path}: ${json.error || "未知错误"}`);
    }

    return json.data as T;
  }
}
