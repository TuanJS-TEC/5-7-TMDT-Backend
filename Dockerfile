# Monorepo — build thư viện + tất cả microservices + web (Vite)
# Mục tiêu runner: node apps/<service>/dist/main.js với WORKDIR tương ứng
# Mục tiêu web: nginx phục vụ SPA + proxy /api → api-gateway

FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci

RUN npm run build:libs && \
    npm run build -w api-gateway -w auth-service -w listing-service -w payment-service -w user-service -w notification-service -w admin-service -w search-service && \
    npm run build -w web

# --- Ảnh chạy Node (mọi service Nest dùng chung) ---
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/libs ./libs
COPY --from=builder /app/apps ./apps

RUN mkdir -p apps/auth-service/uploads apps/listing-service/uploads

CMD ["node", "apps/api-gateway/dist/main.js"]

# --- Ảnh Nginx (giao diện web + proxy API) ---
FROM nginx:1.27-alpine AS web
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY docker/nginx-web.conf /etc/nginx/conf.d/default.conf
