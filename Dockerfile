FROM node:22-bookworm@sha256:cd7bcd2e7a1e6f72052feb023c7f6b722205d3fcab7bbcbd2d1bfdab10b1e935

# Install Bun (required for build scripts)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

RUN corepack enable

WORKDIR /app

# Expose port 8080 for Railway
EXPOSE 8080

ARG OPENCLAW_DOCKER_APT_PACKAGES=""
RUN if [ -n "$OPENCLAW_DOCKER_APT_PACKAGES" ]; then \
      apt-get update && \
      DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends $OPENCLAW_DOCKER_APT_PACKAGES && \
      apt-get clean && \
      rm -rf /var/lib/apt/lists/* /var/cache/apt/archives/*; \
    fi

# Copy all files first (simplified approach)
COPY . .

# Install dependencies
RUN pnpm install

# Build the application
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

# Create data directory for persistent storage first
RUN mkdir -p /tmp/openclaw && chown -R root:root /tmp/openclaw
RUN mkdir -p /tmp/workspace && chown -R root:root /tmp/workspace
RUN mkdir -p /data/.openclaw && chown -R root:root /data/.openclaw

# Fix plugin manifest issues
RUN chmod +x /app/fix-plugins.sh && /app/fix-plugins.sh
RUN chmod +x /app/ensure-config.sh
RUN chmod +x /app/healthcheck.sh

ENV NODE_ENV=production
ENV PORT=8080

# Set environment variable to use temporary directory
ENV OPENCLAW_STATE_DIR=/tmp/openclaw
ENV OPENCLAW_WORKSPACE_DIR=/tmp/workspace
ENV HOME=/tmp/openclaw
ENV USER=root

# Ensure dist directory has correct permissions for node user
RUN chown -R node:node /app/dist

# Security hardening: Run as non-root user
USER root

# Railway health check endpoint - use root path for compatibility
# 在容器启动时重新生成配置，注入运行时环境变量
CMD bash -c 'echo "=== 环境变量 ==="; env | sort; echo "=== 生成配置前 ==="; cat /tmp/openclaw/openclaw.json 2>/dev/null || echo "配置文件不存在"; /app/ensure-config.sh; echo "=== 生成配置后 ==="; cat /tmp/openclaw/openclaw.json; echo "=== 启动OpenClaw ==="; exec node openclaw.mjs gateway --allow-unconfigured --auth token --bind lan --port 8080 --verbose'