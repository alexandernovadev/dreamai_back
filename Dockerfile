# Dreamia backend — multi-stage (NestJS + Mongoose)
# Requiere en runtime: DATABASE_URL (y opcionalmente PORT, AI_*, etc.)
# Node 20 LTS: dependencias transitivas (p. ej. file-type@21) exigen engines ">=20";
# Node 19 no es compatible con `yarn install` en este lockfile (Fly / Docker).

# ==========================================
# Stage 1: Build
# ==========================================
FROM node:20-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY . .
RUN yarn build

RUN yarn install --production --frozen-lockfile && yarn cache clean

# ==========================================
# Stage 2: Production
# ==========================================
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

COPY package.json yarn.lock ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

RUN mkdir -p logs && chown -R nodejs:nodejs logs

USER nodejs

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "dist/main.js"]
