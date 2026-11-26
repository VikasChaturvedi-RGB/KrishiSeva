# ==============================================================================
# Google Cloud Run — Always-Free Tier Container (Stateless, Scale-to-Zero)
# Deploy in us-central1: 2M requests/mo, 360k vCPU-sec, 180k GiB-sec FREE
# ==============================================================================
FROM node:22-slim AS builder

WORKDIR /workspace
COPY package.json ./
COPY web_simulator ./web_simulator
COPY contracts ./contracts
COPY backend/package*.json ./backend/
RUN cd backend && npm ci

COPY backend ./backend
RUN cd backend && npm run build
RUN node -e "const fs=require('fs'); ['public','web_app'].forEach(d => fs.cpSync('web_simulator', d, {recursive:true}));"

FROM node:22-slim AS runner
ENV NODE_ENV=production
ENV PORT=8080
WORKDIR /app

COPY --from=builder /workspace/backend/package*.json ./backend/
RUN cd backend && npm ci --omit=dev && npm cache clean --force

COPY --from=builder /workspace/backend/dist ./backend/dist
COPY --from=builder /workspace/backend/src/db/schema.sql ./backend/dist/db/schema.sql
COPY --from=builder /workspace/backend/src/data ./backend/dist/data
COPY --from=builder /workspace/web_simulator ./web_simulator
COPY --from=builder /workspace/web_app ./web_app
COPY --from=builder /workspace/contracts ./contracts

WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "--no-warnings", "dist/server.js"]
