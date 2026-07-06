# B54 — Worker Playwright (1 browser por vez · VPS/container free tier)
FROM mcr.microsoft.com/playwright:v1.61.1-jammy

WORKDIR /app

ENV NODE_ENV=production
ENV SIGAA_HEADLESS=true
ENV SIGAA_SCRAPER_MOCK=false
ENV WORKER_PORT=8787
ENV SIGAA_WORKER_MAX_CONCURRENT=1

COPY package.json package-lock.json ./
# --include=dev: tsx/pg vivem em devDependencies e o worker roda via tsx.
RUN npm ci --include=dev

COPY tsconfig.json ./
COPY worker ./worker
COPY src ./src

EXPOSE 8787

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "tsx", "worker/main.ts"]
