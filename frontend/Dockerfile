FROM node:20-alpine AS builder
WORKDIR /app

# 빌드 시점 환경변수 (next.config.ts의 rewrites에서 사용)
ARG BACKEND_URL=http://localhost:8080
ENV BACKEND_URL=${BACKEND_URL}

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
# Cloud Run은 PORT 환경변수를 자동 설정 (기본 8080)
ENV PORT=8080
# Next.js standalone은 기본 localhost 바인딩, 0.0.0.0 필요
ENV HOSTNAME="0.0.0.0"

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 8080
CMD ["node", "server.js"]
