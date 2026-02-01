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

# Copy dependency files first for better caching
COPY package.json ./package.json
COPY pnpm-lock.yaml ./pnpm-lock.yaml
COPY pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY .npmrc ./.npmrc

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy all source files
COPY scripts ./scripts
COPY src ./src
COPY apps ./apps
COPY packages ./packages
COPY extensions ./extensions
COPY patches ./patches
COPY ui ./ui

# Build the application
RUN OPENCLAW_A2UI_SKIP_MISSING=1 pnpm build
# Force pnpm for UI build (Bun may fail on ARM/Synology architectures)
ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

ENV NODE_ENV=production
ENV PORT=8080

# Create data directory for persistent storage
RUN mkdir -p /data && chown -R node:node /data

# Ensure dist directory has correct permissions for node user
RUN chown -R node:node /app/dist

# Security hardening: Run as non-root user
# The node:22-bookworm image includes a 'node' user (uid 1000)
# This reduces the attack surface by preventing container escape via root privileges
USER node

# Railway health check endpoint
CMD ["node", "scripts/run-node.mjs", "gateway", "--allow-unconfigured"]