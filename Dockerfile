# ─── 构建阶段 ───────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src/ ./src/

RUN npm run build

# ─── 运行阶段 ───────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm cache clean --force

RUN apk del python3 make g++

COPY --from=builder /app/dist ./dist

ENV DB_PATH=/data/qrcode.db
RUN mkdir -p /data

EXPOSE 8093

CMD ["node", "dist/index.js"]
