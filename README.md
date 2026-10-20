# Backend Safe Path Twin

Un solo backend (NestJS + TypeScript) con **arquitectura hexagonal** y **BFF**, dividido en dos productos.
Hoy incluye una sola demo: **el login del dashboard**.

## 1. Qué es el backend

| Producto | Qué es | Quién se encarga |
|---|---|---|
| **Dashboard** | Tablero institucional que usa el personal de la entidad. | `src/dashboard/`, con su puerta HTTP en `/api/dashboard/v1`. |
| **App móvil** | App ciudadana para reportes y botón de pánico (aún vacía). | `src/mobile/`, con su puerta HTTP en `/api/mobile/v1`. |

Ambos viajan en la misma aplicación y en la misma imagen Docker, pero no se importan entre sí.

## 2. Primeros pasos: clonar y correr

### Requisitos

| Herramienta | Para qué | Cómo verificar | Dónde descargar |
|---|---|---|---|
| Git | Clonar el repositorio | `git --version` | https://git-scm.com/downloads |
| Docker con Docker Compose | Opción A (no necesitas Node) | `docker --version` y `docker compose version` | https://www.docker.com/products/docker-desktop/ |
| Node.js 22 o superior (trae npm) | Opción B y las pruebas | `node -v` (debe decir `v22` o más) y `npm -v` | https://nodejs.org/ |

Necesitas **Git** y al menos **una** de las otras dos opciones.

### Clonar

Reemplaza `<URL-DEL-REPO>` por el enlace que te compartieron:

```bash
git clone <URL-DEL-REPO>
cd BackNDEX
```

(Si la carpeta que se creó tiene otro nombre, entra a esa).

### Configurar

Crea tu archivo `.env` a partir del ejemplo:

```bash
cp .env.example .env        # macOS, Linux o Git Bash
copy .env.example .env      # Windows (CMD o PowerShell)
```

`.env` guarda la configuración de tu máquina y **no se sube al repositorio**. El valor por defecto (`PORT=3000`) sirve para la demo.

### Opción A: con Docker (la más fácil)

Abre Docker Desktop y espera a que diga que está corriendo. Luego:

```bash
docker compose up -d --build     # construye la imagen y la arranca en segundo plano
docker compose ps                # en STATUS debe aparecer "(healthy)" (tarda unos segundos)
docker compose logs -f api       # ver los logs (Ctrl + C para salir)
docker compose down              # apagarlo cuando termines
```

### Opción B: sin Docker

```bash
npm install
npm run start:dev
```

Está listo cuando la consola muestra `Nest application successfully started`. Déjala abierta y usa otra terminal para probar.

### Comprobar que funciona

Funciona igual con la opción A o la B (puerto 3000).

```bash
curl http://localhost:3000/api/health
```

Respuesta esperada: `{"status":"ok"}`

```bash
curl.exe -X POST http://localhost:3000/api/dashboard/v1/auth/login -H "Content-Type: application/json" -d "{\`"email\`":\`"admin@demo.local\`",\`"password\`":\`"demo1234\`"}"
```

Respuesta esperada:

```json
{"access_token":"token-de-prueba","user":{"id":"1","full_name":"Admin Demo","email":"admin@demo.local","role":"admin"}}
```

Con una contraseña errónea:

```bash
curl.exe -X POST http://localhost:3000/api/dashboard/v1/auth/login -H "Content-Type: application/json" -d "{\`"email\`":\`"admin@demo.local\`",\`"password\`":\`"incorrecta\`"}"
```

Respuesta esperada (código `401`): `{"codigo":"CREDENCIALES_INVALIDAS","mensaje":"Correo o contraseña incorrectos"}`

**Desde PowerShell** (allí `curl` es otro comando; usa `Invoke-RestMethod`):

```powershell
Invoke-RestMethod http://localhost:3000/api/health
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/dashboard/v1/auth/login -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"demo1234"}'
```

**Con `demo.http`**: ábrelo en VS Code con la extensión *REST Client* y pulsa *Send Request* sobre cada petición.

### Credenciales de la demo

- Correo: `admin@demo.local`
- Contraseña: `demo1234`

### Correr las pruebas

Necesita Node (opción B instalada con `npm install`):

```bash
npm run test
```

### Problemas comunes

| Síntoma | Solución |
|---|---|
| `EADDRINUSE` o "port is already allocated" (puerto 3000 ocupado) | Cambia `PORT` en `.env` (por ejemplo `PORT=3001`), vuelve a arrancar y usa ese puerto en los `curl`. |
| `Cannot connect to the Docker daemon` o `failed to connect to the docker API` | Docker no está corriendo: abre Docker Desktop y espera a que inicie. |
| `npm install` avisa `EBADENGINE` o la app no arranca | Node es muy viejo: `node -v` debe ser `v22` o más. Instala la versión LTS. |
| Cambiaste `PORT` pero la API sigue en el 3000 | Falta `.env` (o editaste `.env.example`): créalo con `cp .env.example .env` (o `copy` en Windows) y cambia el puerto ahí. |
| Cambiaste código y en Docker no se ve | Reconstruye la imagen: `docker compose up -d --build`. |

## 3. Diagrama

```
            DASHBOARD                                   APP MÓVIL (futuro)
  Cliente (frontend web)                       Cliente (app ciudadana)
          │  HTTP /api/dashboard/v1                    │  HTTP /api/mobile/v1
          ▼                                            ▼
  BFF dashboard (snake_case)                   BFF móvil (camelCase)
          │  solo por index.ts                         │  solo por index.ts
          ▼                                            ▼
  Caso de uso (LoginUseCase)                   Caso de uso (reports, sos)
          │                                            │
          ▼                                            ▼
  Dominio (Usuario)                            Dominio
          ▲                                            ▲
  Puerto (UsuarioRepositoryPort)               Puerto
          ▲ implementa                                 ▲ implementa
  Adaptador (InMemoryUsuarioRepository)        Adaptador

        Los dos productos nunca se importan entre sí.
```

## 4. Hexagonal y BFF en pocas palabras

**Hexagonal.** El negocio (dominio y casos de uso) vive en el centro y no sabe nada de bases de datos ni de HTTP.
Para hablar con el exterior define **puertos** (interfaces); afuera, los **adaptadores** los implementan.
Analogía: un enchufe en la pared. La casa define la forma del enchufe (puerto) y cualquier aparato compatible (adaptador) se conecta.
Así cambiamos el repositorio en memoria por PostgreSQL sin tocar el negocio.

**BFF (Backend For Frontend).** Cada cliente tiene su propia puerta HTTP adaptada a lo que necesita.
El BFF solo recibe la petición, la valida, llama al caso de uso y da forma a la respuesta.
Analogía: un mesero por tipo de cliente. La cocina (el negocio) es la misma; cada mesero sirve el plato como lo pide su mesa.
Por eso el dashboard responde en `snake_case` y el móvil en `camelCase`, sin afectarse entre ellos.

## 5. Reglas de dependencia

`npm run lint` falla si alguna se rompe.

| Carpeta | Import permitido | Import prohibido |
|---|---|---|
| `domain/` | `import { DomainError } from '../../../../shared/domain-error'` | `import { Injectable } from '@nestjs/common'` |
| `application/` | `import { Usuario } from '../domain/usuario'` | `import { InMemoryUsuarioRepository } from '../infrastructure/...'` |
| `infrastructure/` | `import { Injectable } from '@nestjs/common'` | cualquier archivo de `bff/` |
| `dashboard/bff/` | `import { LoginUseCase } from '../../modules/auth'` (su `index.ts`) | `import { LoginUseCase } from '../../modules/auth/application/login.use-case'` |
| `dashboard/` ↔ `mobile/` | — | `import { SosModule } from '../../../mobile/modules/sos'` |
| `platform/` | `import { DomainError } from '../../shared/domain-error'` | cualquier archivo de `dashboard/` o `mobile/` |

## 6. Recorrido del login

1. `src/dashboard/bff/controllers/auth.controller.ts` recibe `POST /api/dashboard/v1/auth/login` y valida el cuerpo con `src/dashboard/bff/dto/login.request.ts`.
2. Llama a `LoginUseCase` a través de `src/dashboard/modules/auth/index.ts` (la única puerta del módulo).
3. `src/dashboard/modules/auth/application/login.use-case.ts` busca el usuario y compara la contraseña con la entidad `Usuario` (`domain/usuario.ts`).
4. Para buscar el usuario usa el puerto `UsuarioRepositoryPort` (`application/usuario.repository.port.ts`).
5. `auth.module.ts` conecta ese puerto con `InMemoryUsuarioRepository` (`infrastructure/in-memory-usuario.repository.ts`).
6. Si algo falla, el caso de uso lanza `CredencialesInvalidasError`; el controlador la convierte en `401`. Si sale bien, responde en `snake_case`.

## 7. Cómo agregar una funcionalidad nueva

1. **Dominio**: crea la entidad y sus errores en `modules/<modulo>/domain/` (TypeScript puro).
2. **Aplicación**: crea el caso de uso (`<accion>.use-case.ts`, con `execute()`) y su puerto con token `Symbol` en `application/`.
3. **Infraestructura**: implementa el puerto en `infrastructure/` (en memoria al principio).
4. **Módulo**: en `<modulo>.module.ts` conecta `{ provide: PUERTO, useClass: Adaptador }` y exporta el caso de uso desde `index.ts`.
5. **BFF**: agrega el DTO y el controlador en `<producto>/bff/`, regístralo en `<producto>-bff.module.ts` y corre `npm run lint && npm run build && npm run test`.

## 8. Hoja de ruta

| Pendiente | Dónde va |
|---|---|
| JWT, guards y roles (reemplaza `token-de-prueba`) | `src/platform/auth/` |
| Multi-tenant (una base de datos por entidad) | `src/platform/tenancy/` |
| PostgreSQL y MongoDB (reemplazan los repositorios en memoria) | `src/platform/database/` + `infrastructure/` de cada módulo |
| Eventos con RabbitMQ (por ejemplo, reportes del móvil hacia el dashboard) | `src/platform/messaging/` |
| Caché con Redis | `src/platform/cache/` |
| Usuarios y KPIs del dashboard | `src/dashboard/modules/users/` y `kpis/` |
| Reportes y SOS de la app móvil, y su BFF | `src/mobile/modules/` y `src/mobile/bff/` |
| Activar `postgres`, `mongo`, `redis` y `rabbitmq` | Descomentarlos en `docker-compose.yml` cuando exista su adaptador |
| Compose de otros entornos y Nginx | `infra/docker/` y `infra/nginx/` |

## 9. Glosario

- **Entidad**: objeto del negocio con sus reglas (por ejemplo, `Usuario`).
- **Caso de uso**: una acción del negocio, con un método `execute()` (por ejemplo, `LoginUseCase`).
- **Puerto**: interfaz que el negocio necesita para hablar con el exterior (por ejemplo, `UsuarioRepositoryPort`).
- **Adaptador**: implementación concreta de un puerto (por ejemplo, `InMemoryUsuarioRepository`).
- **DTO**: forma de los datos que entran o salen por HTTP (por ejemplo, `LoginRequest`).
- **BFF**: la puerta HTTP propia de cada producto.

## 10. Más detalle

El mapa completo de carpetas y archivos está en [`estructura.md`](estructura.md).
