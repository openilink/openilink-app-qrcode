/**
 * 二维码工具模块 — 生成二维码、解码二维码
 */

import QRCode from "qrcode";
import jsQR from "jsqr";
import { Jimp } from "jimp";
import type { ToolModule, ToolDefinition, ToolHandler } from "../hub/types.js";

/** 工具定义 */
const definitions: ToolDefinition[] = [
  {
    name: "generate_qrcode",
    description: "生成二维码，将文本或链接编码为二维码图片（返回 base64 data URL）",
    command: "generate_qrcode",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "要编码的内容" },
        size: { type: "number", description: "二维码图片尺寸（像素），默认 300" },
      },
      required: ["text"],
    },
  },
  {
    name: "decode_qrcode",
    description: "解码二维码，从图片 URL 中识别二维码内容",
    command: "decode_qrcode",
    parameters: {
      type: "object",
      properties: {
        image_url: { type: "string", description: "二维码图片 URL" },
      },
      required: ["image_url"],
    },
  },
];

/**
 * 生成二维码
 * @param text 要编码的内容
 * @param size 图片尺寸，默认 300
 * @returns base64 data URL
 */
export async function generateQRCode(text: string, size: number = 800): Promise<string> {
  const dataUrl = await QRCode.toDataURL(text, { width: size, margin: 2 });
  return dataUrl;
}

/**
 * 解码二维码
 * @param imageUrl 图片 URL
 * @returns 解码后的文本内容
 */
export async function decodeQRCode(imageUrl: string): Promise<string> {
  // 下载图片
  const resp = await fetch(imageUrl);
  if (!resp.ok) {
    throw new Error(`下载图片失败: ${resp.status}`);
  }

  const arrayBuffer = await resp.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 使用 Jimp 读取图片
  const image = await Jimp.read(buffer);
  const width = image.width;
  const height = image.height;

  // 获取像素数据（RGBA）
  const imageData = new Uint8ClampedArray(image.bitmap.data);

  // 使用 jsQR 解码
  const code = jsQR(imageData, width, height);
  if (!code) {
    throw new Error("未能识别二维码内容");
  }

  return code.data;
}

/** 创建处理函数 */
function createHandlers(): Map<string, ToolHandler> {
  const handlers = new Map<string, ToolHandler>();

  handlers.set("generate_qrcode", async (ctx) => {
    try {
      const { text, size } = ctx.args;
      if (!text) return "错误：请提供要编码的内容（text）";

      const qrSize = size ? Number(size) : 300;
      const dataUrl = await generateQRCode(String(text), qrSize);

      // 返回 ToolResult，Hub 会以图片形式发送给用户
      return {
        reply: `📱 二维码已生成，内容: ${text}`,
        type: "image",
        base64: dataUrl,
        name: "qrcode.png",
      };
    } catch (err: any) {
      return `生成二维码失败：${err.message}`;
    }
  });

  handlers.set("decode_qrcode", async (ctx) => {
    try {
      const { image_url } = ctx.args;
      if (!image_url) return "错误：请提供图片 URL（image_url）";

      const decoded = await decodeQRCode(String(image_url));
      return `📱 二维码内容: ${decoded}`;
    } catch (err: any) {
      return `解码二维码失败：${err.message}`;
    }
  });

  return handlers;
}

export const qrcodeTools: ToolModule = { definitions, createHandlers };
