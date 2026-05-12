# syntax=docker/dockerfile:1.6

FROM node:24-alpine AS base
WORKDIR /app
# Build tools for native modules whose prebuilts don't cover the Node 24 +
# musl + arm64 combo (notably better-sqlite3). Only kept in the intermediate
# stages — the final runner is a fresh node:24-alpine.
RUN apk add --no-cache python3 make g++

FROM base AS deps
COPY package*.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS prod-deps
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-alpine AS runner
ENV NODE_ENV=production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package*.json ./

RUN addgroup -S app && adduser -S app -G app \
  && chown -R app:app /app

USER app

EXPOSE 3000
CMD ["node", "dist/main.js"]
