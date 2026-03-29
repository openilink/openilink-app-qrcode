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

## License

MIT
