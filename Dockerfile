# Una sola imagen para todo el backend (dashboard y mobile viajan juntos).

# Etapa 1: compila TypeScript a dist/.
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Node 26 LTS ya trae npm 11 que acepta el lockfile asi que no hace falta instalar otro npm
RUN npm ci
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build && npm prune --omit=dev

# Etapa 2: solo dist/ y dependencias de producción, sin herramientas de compilación.
FROM node:26-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Certificado publico de la autoridad de AWS que firma los certificados de RDS
# la api lo usa para verificar que se conecta a la RDS real (ver DATABASE_SSL_CA en el README)
# 644 para que el usuario node lo pueda leer y en local no se usa porque el compose pone DATABASE_SSL=false
ADD --chmod=644 https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/certs/global-bundle.pem
ENV DATABASE_SSL_CA=/app/certs/global-bundle.pem
USER node
EXPOSE 3001
HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3001}/api/health" || exit 1
CMD ["node", "dist/main.js"]
