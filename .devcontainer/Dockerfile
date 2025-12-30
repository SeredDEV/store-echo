# Use Node.js 22 LTS as base image
FROM node:22-bullseye

# Install additional dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    git \
    curl \
    wget \
    ca-certificates \
    build-essential \
    python3 \
    python3-pip \
    postgresql-client \
    redis-tools \
    libvips-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages for development
RUN npm install -g \
    typescript \
    ts-node \
    nodemon \
    @medusajs/medusa-cli \
    pnpm

# Set working directory
WORKDIR /workspaces/store-echo

# Keep container running
CMD ["sleep", "infinity"]
