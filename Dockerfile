# ==============================================================================
# Dockerfile Multi-Stage para SCVehiculos (Astro + Node.js Standalone)
# ==============================================================================

# --- Etapa Base ---
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# --- Etapa de Dependencias ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install

# --- Etapa de Compilación ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm build

# --- Etapa de Ejecución (Producción) ---
FROM base AS runner
WORKDIR /app

# Instalar MariaDB liviano para modo autónomo en la nube (Render) cuando no hay BD externa
RUN apk add --no-cache mariadb mariadb-client

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

# Copiar artefactos de compilación y node_modules requeridos
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/database ./database
COPY --from=builder /app/scripts ./scripts

EXPOSE 4321

CMD ["sh", "-c", "node scripts/init_db.mjs && node ./dist/server/entry.mjs"]
