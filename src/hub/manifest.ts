/**
 * 应用清单定义
 */

export interface AppManifest {
  slug: string;
  name: string;
  icon: string;
  description: string;
  events: string[];
}

/** 二维码工具应用清单 */
export const manifest: AppManifest = {
  slug: "qrcode",
  name: "二维码工具",
  icon: "📱",
  description: "生成和解码二维码，支持文本、链接等内容",
  events: ["command"],
};
