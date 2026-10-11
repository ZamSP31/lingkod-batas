FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends poppler-utils ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY --chown=node:node server.js ./
COPY --chown=node:node src ./src
RUN mkdir -p tmp/ocr && chown -R node:node tmp
ENV NODE_ENV=production HOST=0.0.0.0
USER node
CMD ["node", "server.js"]
