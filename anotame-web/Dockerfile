FROM oven/bun:latest AS builder
WORKDIR /app

# Ensure we have package.json and bun.lock initialized
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# These args are ingested by SvelteKit's dynamic/static `$env` process at build time
ARG PUBLIC_IDENTITY_URL
ARG PUBLIC_CATALOG_URL
ARG PUBLIC_SALES_URL
ARG PUBLIC_OPERATIONS_URL

ENV PUBLIC_IDENTITY_URL=$PUBLIC_IDENTITY_URL
ENV PUBLIC_CATALOG_URL=$PUBLIC_CATALOG_URL
ENV PUBLIC_SALES_URL=$PUBLIC_SALES_URL
ENV PUBLIC_OPERATIONS_URL=$PUBLIC_OPERATIONS_URL

COPY . .
RUN bun run build

FROM oven/bun:latest AS runner
WORKDIR /app
USER bun

# SvelteKit node adapter outputs to `build` by default in Bun context
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .

ENV PORT 3000
EXPOSE 3000

# Node adapter provides a standard `index.js` server
CMD ["bun", "./build/index.js"]
