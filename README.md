# @openilink/app-qrcode

二维码工具，支持生成和解码二维码。

## 特色

- **生成二维码** — 将文本、链接等内容编码为二维码图片（base64 data URL）
- **解码二维码** — 从图片 URL 中识别并提取二维码内容
- **纯 JS 实现** — 使用 qrcode + jsqr + jimp，无需外部 API

## 快速开始

```bash
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

## 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `HUB_URL` | 是 | — | OpeniLink Hub 服务地址 |
| `BASE_URL` | 是 | — | 本服务的公网回调地址 |
| `DB_PATH` | 否 | `data/qrcode.db` | SQLite 数据库文件路径 |
| `PORT` | 否 | `8093` | HTTP 服务端口 |

## 2 个 AI Tools

| 工具名 | 说明 |
|--------|------|
| `generate_qrcode` | 生成二维码 |
| `decode_qrcode` | 解码二维码 |

## API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/hub/webhook` | 接收 Hub 推送的事件 |
| `GET` | `/oauth/setup` | 启动 OAuth 安装流程 |
| `GET` | `/oauth/redirect` | OAuth 回调处理 |
| `GET` | `/manifest.json` | 返回应用清单 |
| `GET` | `/health` | 健康检查 |

## 使用方式

安装到 Bot 后，支持三种方式调用：

### 自然语言（推荐）

直接用微信跟 Bot 对话，Hub AI 会自动识别意图并调用对应功能：

- "帮我生成一个二维码，内容是 https://example.com"
- "这个二维码扫一下是什么内容"

### 命令调用

也可以使用 `/命令名 参数` 的格式直接调用：

- `/generate_qrcode --text https://example.com`

### AI 自动调用

Hub AI 在多轮对话中会自动判断是否需要调用本 App 的功能，无需手动触发。

## 安全与隐私

- **无需 API Key**：本 App 使用免费公开 API，不需要任何认证信息
- **不存储数据**：纯工具型应用，请求即响应，无任何持久化
- 如需自部署：`docker compose up -d`

## License

MIT
