# syntax=docker/dockerfile:1

FROM node:24-alpine AS dependencies
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

COPY ["InventoryManagement.Web/package.json", "InventoryManagement.Web/package-lock.json", "./"]
RUN npm ci

FROM node:24-alpine AS build
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# NEXT_PUBLIC variables are embedded in the browser bundle during next build.
# An empty value means same-origin API calls such as /api/products in production.
ARG NEXT_PUBLIC_API_BASE_URL=""
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}

COPY --from=dependencies /app/node_modules ./node_modules
COPY ["InventoryManagement.Web/", "./"]
RUN npm run build

FROM node:24-alpine AS final
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

CMD ["node", "server.js"]
