FROM node:24-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ git ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.33.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps ./apps
COPY assets ./assets
COPY design-systems ./design-systems
COPY packages ./packages
COPY scripts ./scripts
COPY skills ./skills
COPY templates ./templates
COPY tools ./tools

RUN pnpm install --frozen-lockfile
RUN pnpm --filter @open-design/daemon build
RUN pnpm --filter @open-design/web build

FROM node:24-bookworm-slim AS runtime

WORKDIR /app

ENV NODE_ENV=production \
    HOME=/home/opendesign \
    OD_HOST=0.0.0.0 \
    OD_PORT=5821 \
    OD_DATA_DIR=/data/.od

COPY --from=builder /app /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends bash git openssh-client ca-certificates poppler-utils \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g @google/gemini-cli @openai/codex \
  && npm cache clean --force \
  && mkdir -p /data /home/opendesign

EXPOSE 5821

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.OD_PORT || '7456') + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "apps/daemon/dist/cli.js", "--no-open"]
