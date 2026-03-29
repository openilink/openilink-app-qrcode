/**
 * 应用清单定义
 */

export interface AppManifest {
  slug: string;
  name: string;
  icon: string;
  description: string;
  events: string[];
  /** 配置表单 JSON Schema */
  config_schema?: Record<string, unknown>;
  /** 安装引导说明（Markdown） */
  guide?: string;
}

/** 二维码工具应用清单 */
export const manifest: AppManifest = {
  slug: "qrcode",
  name: "二维码工具",
  icon: "📱",
  description: "生成和解码二维码，支持文本、链接等内容",
  events: ["command"],
  config_schema: { type: "object", properties: {} },
  guide: "## 二维码工具\n无需配置，直接安装即可使用。\n\n支持生成和解码二维码。",
};
