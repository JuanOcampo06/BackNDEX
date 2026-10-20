# CLAUDE.md — Backend Safe Path Twin

Un solo backend (NestJS + TypeScript) dividido en **dos productos**: el **dashboard** institucional y la **app móvil**.
Cada producto tiene su propio **BFF** (su puerta HTTP) y sus propios **módulos hexagonales**.
No hay microservicios. No hay machine learning, cámaras ni nodos edge.

## Estructura (pocas carpetas; no agregar más sin motivo)

Las carpetas marcadas "(futuro)" existen vacías con un `.gitkeep`. **No se implementan todavía**, pero ya tienen su lugar.

```
src/
  main.ts
  app.module.ts
  shared/                      errores base (TypeScript simple)
  platform/                    herramientas técnicas (futuro)
    auth/                      JWT, guards, roles
    tenancy/                   multi-tenant, una base de datos por entidad
    database/                  PostgreSQL y MongoDB
    messaging/                 RabbitMQ / eventos
    cache/                     Redis

  dashboard/                   PRODUCTO 1: tablero institucional
    bff/                       única puerta HTTP: /api/dashboard/v1
      controllers/
      dto/
      dashboard-bff.module.ts
    modules/                   negocio del dashboard, SIN controladores
      auth/                    login (único con código en la demo)
      users/                   gestión de usuarios (futuro)
      kpis/                    cifras y mapas (futuro)
        domain/                entidades, reglas y errores (TypeScript puro)
        application/           casos de uso y puertos (interfaces)
        infrastructure/        adaptadores (en memoria hoy; BD real mañana)
        <modulo>.module.ts     conecta cada puerto con su adaptador
        index.ts               lo único que el BFF puede importar del módulo

  mobile/                      PRODUCTO 2: app ciudadana (futuro, vacío)
    bff/                       única puerta HTTP: /api/mobile/v1
      controllers/
      dto/
      mobile-bff.module.ts
    modules/
      reports/                 reportes ciudadanos (futuro)
      sos/                     botón de pánico (futuro)
        domain/  application/  infrastructure/
        <modulo>.module.ts  index.ts

infra/                         despliegue adicional (futuro)
  docker/                      otros compose (QA, producción)
  nginx/
test/                          pruebas e2e
Dockerfile                     imagen de la API (multietapa, usuario no root)
docker-compose.yml             solo el servicio `api`; el resto comentado
.dockerignore
estructura.md                  mapa de carpetas y archivos
README.md                      qué es, cómo probarlo, hoja de ruta
```

## Docker (mínimo)

El proyecto corre en Docker, pero **solo la API**: la demo no usa bases de datos.

- Una sola imagen para todo el backend (dashboard y mobile viajan juntos). Nunca una imagen por producto.
- `Dockerfile` multietapa: compila con `node:22-alpine` y ejecuta solo `dist/` y dependencias de producción, con `USER node`, `HEALTHCHECK` a `/api/health` y sin la etiqueta `latest`.
- `docker-compose.yml` con un único servicio `api`. Los servicios `postgres`, `mongo`, `redis` y `rabbitmq` quedan **comentados** como referencia para el futuro; no se activan hasta que existan sus adaptadores.
- Secretos y configuración por variables de entorno (`.env`, nunca versionado; se versiona `.env.example`). Nada de secretos dentro de la imagen.
- La demo se puede correr de dos formas: local (`npm run start:dev`) o en Docker (`docker compose up -d --build`).

## Reglas de dependencia

| Carpeta | Puede importar | Nunca importa |
|---|---|---|
| `domain/` | su propio `domain/` y `shared/` | NestJS, bases de datos, `application/`, `infrastructure/` |
| `application/` | `domain/` y `shared/` | NestJS, bases de datos, `infrastructure/`, `bff/` |
| `infrastructure/` | su módulo, `platform/` y librerías externas | `bff/` |
| `<producto>/bff/` | el `index.ts` de los módulos **de su mismo producto** y `platform/auth` | `domain/`, `application/`, `infrastructure/` directamente |
| `platform/` | `shared/` y librerías externas | `dashboard/`, `mobile/` |

**Los dos productos no se importan entre sí.** Si algún día necesitan compartir algo (por ejemplo, los reportes que crea el móvil y muestra el dashboard), se hará con eventos o contratos en `shared/`/`platform/messaging`, nunca importando archivos del otro producto.

## Reglas hexagonales

- **Dominio**: clases y reglas de negocio puras. Validan sus datos y lanzan `DomainError`. No llaman a `new Date()` ni generan IDs: los reciben por parámetro.
- **Aplicación**: un caso de uso por archivo, con un método `execute()`. Depende de **puertos** (interfaces con un token `Symbol`), nunca de una base de datos concreta.
- **Infraestructura**: implementa los puertos. Hoy es **en memoria**; luego se cambia por PostgreSQL/MongoDB (usando `platform/database`) sin tocar dominio ni aplicación.
- **`<modulo>.module.ts`**: único lugar donde se escribe `{ provide: PUERTO, useClass: Adaptador }`.
- **Platform**: la parte técnica reutilizable. Hoy vacía; los módulos la usan solo desde `infrastructure/`.

## Reglas BFF

- Cada producto tiene su BFF; los módulos de negocio **no** tienen controladores.
- El controlador solo: valida el DTO, llama al caso de uso y responde. Cero lógica de negocio.
- BFF dashboard: JSON en `snake_case`. BFF móvil: `camelCase`.
- Un cambio en un BFF nunca debe obligar a cambiar el otro.

## Código limpio

- TypeScript `strict`, sin `any`.
- Nombres de negocio en español sin tildes (`Usuario`, `LoginUseCase`); sufijos técnicos en inglés (`Port`, `Repository`, `UseCase`, `Controller`).
- Archivos en kebab-case: `login.use-case.ts`, `usuario.repository.port.ts`.
- Funciones cortas, una responsabilidad, sin números mágicos ni código muerto.
- Comentarios solo para explicar el porqué.
- No crear abstracciones que nadie use todavía.

## Comandos

```bash
# Local
npm install
npm run start:dev     # http://localhost:3000/api
npm run lint && npm run build && npm run test

# Docker
cp .env.example .env
docker compose up -d --build
docker compose logs -f api
docker compose down
```

## Prohibido

- Controladores dentro de `modules/`.
- Importar NestJS, TypeORM o drivers en `domain/` o `application/`.
- Que `dashboard/` importe de `mobile/` o al revés.
- Dividir el backend en varios servicios o imágenes Docker.
- Activar en el compose bases de datos o brokers que aún no tienen adaptador.
- Cualquier referencia a ML, cámaras, YOLO, GPU o nodos edge.
- Inventar endpoints o campos no pedidos: si falta información, pregunta.

## Definición de terminado

`lint`, `build` y `test` en verde, la imagen Docker construye y responde en `/api/health`, `README.md` con una guía de primeros pasos (clonar, configurar, correr con y sin Docker, comprobar) probada desde una copia limpia, `estructura.md` al día, y ninguna regla de dependencia rota.