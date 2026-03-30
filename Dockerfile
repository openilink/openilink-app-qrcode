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

RUN addgroup -S app && adduser -S app -G app

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apk add --no-cache python3 make g++ \
    && npm ci --omit=dev \
    && npm cache clean --force \
    && apk del python3 make g++

COPY --from=builder /app/dist ./dist

RUN mkdir -p /data && chown -R app:app /data /app

USER app

ENV NODE_ENV=production
ENV DB_PATH=/data/qrcode.db

EXPOSE 8093

CMD ["node", "dist/index.js"]
