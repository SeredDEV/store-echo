# Base image with Node.js 24 LTS (Krypton)
FROM node:24-bookworm

# Install additional system dependencies
RUN apt-get update && export DEBIAN_FRONTEND=noninteractive \
    && apt-get -y install --no-install-recommends \
    # PostgreSQL client tools
    postgresql-client \
    # Build tools for native modules
    build-essential \
    python3 \
    python3-pip \
    # Git
    git \
    # Utilities
    curl \
    wget \
    vim \
    nano \
    zsh \
    # Clean up
    && apt-get autoremove -y \
    && apt-get clean -y \
    && rm -rf /var/lib/apt/lists/*

# Install global npm packages (yarn is already included in node:24 image)
RUN npm install -g \
    npm@latest \
    pnpm \
    typescript \
    ts-node \
    nodemon \
    pm2 \
    @medusajs/medusa-cli

# Set up zsh for root user
RUN chsh -s $(which zsh) root

# Install Oh My Zsh for root user (remove existing installation first if present)
RUN rm -rf /root/.oh-my-zsh && \
    sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Set working directory
WORKDIR /workspaces/store-echo

# Default command
CMD ["sleep", "infinity"]
