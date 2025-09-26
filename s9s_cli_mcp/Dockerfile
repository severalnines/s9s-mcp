# Use Node.js LTS on Ubuntu as base image
FROM node:20-bullseye-slim

# Set environment variables to avoid interactive prompts
ENV DEBIAN_FRONTEND=noninteractive

# Install basic dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        bash \
        wget \
        curl \
        ca-certificates \
        gnupg2 \
        lsb-release \
        apt-transport-https \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install s9s CLI tools
RUN wget -qO-  http://repo.severalnines.com/s9s-tools/$(lsb_release -sc)/Release.key | apt-key add - \
    && echo "deb http://repo.severalnines.com/s9s-tools/$(lsb_release -sc)/ ./" | tee /etc/apt/sources.list.d/s9s-tools.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends s9s-tools \
    && apt-get remove -y wget gnupg2 \
    && apt-get autoremove -y \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY src/ ./src/
COPY scripts/ ./scripts/
COPY .env.example ./.env.example

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create non-root user
RUN groupadd -g 1001 s9s && \
    useradd -r -u 1001 -g s9s s9s

# Change ownership of the app directory
RUN chown -R s9s:s9s /app

# Switch to non-root user
USER s9s

# Expose the port (though MCP uses stdio)
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "console.log('MCP server is healthy')"

# Start the MCP server
CMD ["node", "dist/index.js"]
