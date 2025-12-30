FROM node:22-alpine

# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache \
    build-base \
    gcc \
    autoconf \
    automake \
    zlib-dev \
    libpng-dev \
    nasm \
    bash \
    vips-dev \
    git \
    python3 \
    postgresql-client

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app

# Copy package files first (for better caching)
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn config set network-timeout 600000 -g && \
    yarn install --frozen-lockfile

# Copy application code (esto se sobreescribirá con los volúmenes en desarrollo)
COPY . .

# Build the admin panel (opcional, solo si quieres pre-compilarlo)
# RUN yarn build

EXPOSE 1337

# Usar develop para hot-reloading en desarrollo
CMD ["yarn", "develop"]

