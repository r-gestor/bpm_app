FROM node:20-slim AS base

# Dependencias del sistema para que Chrome for Testing (Puppeteer) funcione en Docker
RUN apt-get update && apt-get install -y \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libgbm1 \
    libgdk-pixbuf2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    ca-certificates \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteer descargará Chrome for Testing en este directorio controlado
ENV PUPPETEER_CACHE_DIR=/app/.puppeteer-cache
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# npm ci descarga dependencias Y Chrome for Testing en PUPPETEER_CACHE_DIR
RUN npm ci

# ── builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# Variables placeholder para que el build no falle al analizar rutas.
# Los valores reales se inyectan en runtime desde Easypanel.
ENV NEXTAUTH_SECRET=build-placeholder
ENV NEXTAUTH_URL=http://localhost:3000
ENV NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder
ENV SUPABASE_SERVICE_ROLE_KEY=placeholder
ENV ANTHROPIC_API_KEY=placeholder
ENV VOYAGE_API_KEY=placeholder
ENV BREVO_API_KEY=placeholder
ENV NEXT_PUBLIC_WOMPI_PUBLIC_KEY=placeholder
ENV WOMPI_INTEGRITY_SECRET=placeholder
ENV WOMPI_EVENTS_SECRET=placeholder
ENV GOOGLE_CLIENT_ID=placeholder
ENV GOOGLE_CLIENT_SECRET=placeholder

RUN npm run build

# ── runner ────────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copiar Chrome for Testing descargado en la etapa deps
COPY --from=deps --chown=nextjs:nodejs /app/.puppeteer-cache /app/.puppeteer-cache

# Reemplazar chrome_crashpad_handler con un no-op para evitar el error FATAL
# Chrome requiere que el binario exista, pero no necesitamos crash reporting
RUN find /app/.puppeteer-cache -name "chrome_crashpad_handler" -exec sh -c 'echo "#!/bin/sh\nexit 0" > "$1" && chmod +x "$1"' _ {} \;

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV PUPPETEER_CACHE_DIR=/app/.puppeteer-cache

CMD ["node", "server.js"]
