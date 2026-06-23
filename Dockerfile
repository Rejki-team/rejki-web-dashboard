# ─────────────────────────────────────────────────────────────────────────────
# Rejki Web Dashboard — Multi-stage Dockerfile
# Stage 1: Build dengan Bun
# Stage 2: Serve static files via Nginx (alpine, ringan)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM oven/bun:1.3 AS build

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock ./

# Install dependencies (frozen lockfile = reproducible build)
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build for production (vue-tsc + vite build)
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_MAX_EVIDENCE_BYTES=5242880

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_MAX_EVIDENCE_BYTES=${VITE_MAX_EVIDENCE_BYTES}

RUN bun run build

# ── Stage 2: Serve via Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
