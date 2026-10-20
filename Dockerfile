# Una sola imagen para todo el backend (dashboard y mobile viajan juntos).

# Etapa 1: compila TypeScript a dist/.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# npm 11, igual que en local: el npm 10 de la imagen rechaza los lockfiles generados con npm 11.
RUN npm install -g npm@11 && npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Etapa 2: solo dist/ y dependencias de producción, sin herramientas de compilación.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1
CMD ["node", "dist/main.js"]
