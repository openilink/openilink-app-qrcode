/**
 * Hub 协议相关类型定义
 */

/** Hub 推送的事件结构 */
export interface HubEvent {
  v: string;
  type: string;
  trace_id: string;
  challenge?: string;
  installation_id: string;
  bot: { id: string };
  event?: {
    type: string;
    id: string;
    timestamp: string;
    data: Record<string, unknown>;
  };
}

/** 安装实例记录 */
export interface Installation {
  id: string;
  hubUrl: string;
  appId: string;
  botId: string;
  appToken: string;
  webhookSecret: string;
  createdAt?: string;
}

/** AI Tool 定义 */
export interface ToolDefinition {
  name: string;
  description: string;
  command: string;
  parameters?: Record<string, unknown>;
}

/** AI Tool 执行上下文 */
export interface ToolContext {
  installationId: string;
  botId: string;
  userId: string;
  traceId: string;
  args: Record<string, any>;
}

/** AI Tool 处理函数类型 */
export type ToolHandler = (ctx: ToolContext) => Promise<string>;

/** 工具模块接口（纯 Tools 型） */
export interface ToolModule {
  definitions: ToolDefinition[];
  createHandlers: () => Map<string, ToolHandler>;
}
