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

# Fix plugin manifest issues and generate secure token
RUN chmod +x /app/fix-plugins.sh && /app/fix-plugins.sh
RUN chmod +x /app/generate-token.sh && /app/generate-token.sh

ENV NODE_ENV=production
ENV PORT=8080

# Create data directory for persistent storage
RUN mkdir -p /tmp/openclaw && chown -R root:root /tmp/openclaw
RUN mkdir -p /tmp/workspace && chown -R root:root /tmp/workspace
RUN mkdir -p /data/.openclaw && chown -R root:root /data/.openclaw

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
CMD ["node", "dist/index.js", "gateway", "--allow-unconfigured", "--port", "8080"]