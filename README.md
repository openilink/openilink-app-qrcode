# @openilink/app-qrcode

微信二维码生成与解码 -- 纯本地 JS 运算，无需外部 API，零配置即用。

> **一键安装** -- 前往 [OpeniLink Hub 应用市场](https://hub.openilink.com) 搜索「二维码」，点击安装即可在微信中使用。

## 功能亮点

- **生成二维码** -- 将文本、链接等内容编码为二维码图片
- **解码二维码** -- 从图片中识别并提取二维码内容
- **纯本地运算** -- 使用 qrcode + jsqr + jimp，无需外部 API，无需 API Key

## 使用方式

安装到 Bot 后，直接用微信对话即可：

**自然语言（推荐）**

- "帮我生成一个二维码，内容是 https://example.com"
- "这个二维码扫一下是什么内容"

**命令调用**

- `/generate_qrcode --text https://example.com`

**AI 自动调用** -- Hub AI 在多轮对话中会自动判断是否需要调用二维码功能，无需手动触发。

### AI Tools

| 工具名 | 说明 |
|--------|------|
| `generate_qrcode` | 生成二维码 |
| `decode_qrcode` | 解码二维码 |

<details>
<summary><strong>部署与开发</strong></summary>

### 快速开始

```bash
npm install
npm run dev
```

### Docker 部署

```bash
docker-compose up -d
```

### 环境变量

| 变量名 | 必填 | 默认值 | 说明 |
|--------|------|--------|------|
| `HUB_URL` | 是 | -- | OpeniLink Hub 服务地址 |
| `BASE_URL` | 是 | -- | 本服务的公网回调地址 |
| `DB_PATH` | 否 | `data/qrcode.db` | SQLite 数据库文件路径 |
| `PORT` | 否 | `8093` | HTTP 服务端口 |

### API 路由

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/hub/webhook` | 接收 Hub 推送的事件 |
| `GET` | `/oauth/setup` | 启动 OAuth 安装流程 |
| `GET` | `/oauth/redirect` | OAuth 回调处理 |
| `GET` | `/manifest.json` | 返回应用清单 |
| `GET` | `/health` | 健康检查 |

</details>

## 安全与隐私

- **无需 API Key** -- 纯本地运算，不依赖任何外部服务
- **不存储数据** -- 纯工具型应用，请求即响应，无任何持久化
- 如需自部署：`docker compose up -d`

## License

MIT
