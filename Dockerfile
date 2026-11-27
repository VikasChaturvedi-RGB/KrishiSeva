# ==============================================================================
# Google Cloud Run — Always-Free Tier Production Container (asia-south1 Mumbai)
# Stateless, Scale-to-Zero (min-instances=0), Non-Root User, Healthcheck Ready
# ==============================================================================
FROM node:22-slim AS builder

WORKDIR /workspace
COPY package.json ./
COPY web_simulator ./web_simulator
COPY contracts ./contracts
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend ./backend
RUN npm run build && cd backend && npm run build

FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV PORT=8080
ENV CLOUD_RUN_REGION=asia-south1
WORKDIR /app

COPY --from=builder /workspace/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force && mkdir -p /app/backend/data && chown -R node:node /app

COPY --chown=node:node --from=builder /workspace/backend/dist ./backend/dist
COPY --chown=node:node --from=builder /workspace/backend/src/db/schema.sql ./backend/dist/db/schema.sql
COPY --chown=node:node --from=builder /workspace/backend/src/data ./backend/dist/data
COPY --chown=node:node --from=builder /workspace/web_simulator ./web_simulator
COPY --chown=node:node --from=builder /workspace/web_app ./web_app
COPY --chown=node:node --from=builder /workspace/contracts ./contracts

USER node
WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "--no-warnings", "dist/server.js"]
