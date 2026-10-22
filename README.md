# Backend Safe Path Twin

Un solo backend (NestJS + TypeScript) con **arquitectura hexagonal** y **BFF**, dividido en dos productos.
Hoy incluye el **login de demostración** del dashboard, los **endpoints de cada tarjeta y gráfica del tablero** y un endpoint de **ciclovías por zona del mapa** que comparten el dashboard y la app móvil. Todo lee de una base de datos **PostgreSQL local**.

## 1. Qué es el backend

| Producto | Qué es | Quién se encarga |
|---|---|---|
| **Dashboard** | Tablero institucional que usa el personal de la entidad. | `src/dashboard/`, con su puerta HTTP en `/api/dashboard/v1`. |
| **App móvil** | App ciudadana para reportes y botón de pánico (por ahora solo expone las ciclovías). | `src/mobile/`, con su puerta HTTP en `/api/mobile/v1`. |
| **Común** | Negocio que leen los dos productos (hoy, las ciclovías). No tiene puerta HTTP propia. | `src/common/`; cada producto lo expone desde su BFF. |

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

`.env` guarda la configuración de tu máquina y **no se sube al repositorio**. Los valores por defecto sirven tal cual: puerto `3000` para la API, `5432` para PostgreSQL y `8081` para Adminer, con usuario, contraseña y base `safepath`.

### Opción A: con Docker (la más fácil)

Abre Docker Desktop y espera a que diga que está corriendo. Luego:

```bash
docker compose up -d --build     # construye la imagen y arranca api, postgres y adminer
docker compose ps                # api y postgres deben decir "(healthy)" (tarda unos segundos)
docker compose logs -f api       # ver los logs (Ctrl + C para salir)
docker compose down              # apagarlo cuando termines (los datos se conservan)
```

La primera vez, PostgreSQL crea las tablas y carga los datos de prueba solo (scripts de `infra/postgres/`).

### Opción B: sin Docker para la API

La API necesita una base de datos PostgreSQL. Lo más fácil es levantar solo esa parte con Docker:

```bash
docker compose up -d postgres adminer
npm install
npm run start:dev
```

Si prefieres tu propio PostgreSQL instalado, crea la base y carga los scripts (ajusta `DATABASE_URL` en `.env` si usas otro usuario):

```bash
psql -U postgres -c "CREATE USER safepath PASSWORD 'safepath'" -c "CREATE DATABASE safepath OWNER safepath"
psql -U safepath -d safepath -f infra/postgres/01-esquema.sql
psql -U safepath -d safepath -f infra/postgres/02-datos.sql
psql -U safepath -d safepath -v carpeta=infra/postgres -f infra/postgres/03-ciclovias.sql
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

Un endpoint del tablero:

```bash
curl http://localhost:3000/api/dashboard/v1/tablero/tarjetas/siniestros
```

Respuesta esperada (los números cambian según la fecha en que se cargaron los datos):

```json
{"valor":1119,"valor_periodo_anterior":1090,"variacion_porcentual":2.7,"serie_semanal":[{"semana":"2026-07-27","total":33}]}
```

**Con `demo.http`**: ábrelo en VS Code con la extensión *REST Client* y pulsa *Send Request* sobre cada petición. Incluye todas las del tablero.

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
| "port is already allocated" en el `5432` o el `8081` | Ya tienes otro PostgreSQL o servicio en ese puerto: cambia `POSTGRES_PORT` o `ADMINER_PORT` en `.env` (y el puerto de `DATABASE_URL` si corres la API sin Docker). |
| Los endpoints del tablero responden `500` | La API no llega a la base: revisa que `postgres` esté `(healthy)` en `docker compose ps` y, sin Docker, que `DATABASE_URL` en `.env` sea correcta. |
| El tablero sale vacío o con meses sin datos | Los datos se generan hasta el día en que se creó la base. Vuelve a crearla con `docker compose down -v` y `docker compose up -d`. |

## 3. Base de datos

PostgreSQL corre en su propio contenedor (`postgres`) y guarda los datos en el volumen `postgres-data`. Por eso los datos sobreviven a un `docker compose down`.

**Cómo verla en el navegador (Adminer):** abre http://localhost:8081 e inicia sesión con:

| Campo | Valor |
|---|---|
| Sistema | PostgreSQL |
| Servidor | `postgres` |
| Usuario / Contraseña | `safepath` / `safepath` |
| Base de datos | `safepath` |

**Desde la terminal:** `docker compose exec postgres psql -U safepath -d safepath`.
**Desde un cliente de escritorio** (DBeaver, TablePlus, extensión de VS Code): `localhost:5432` con el mismo usuario.

| Tabla | Qué guarda |
|---|---|
| `localidades` | Localidades del filtro *Localidad*. |
| `lugares` | Intersecciones donde ocurren los eventos (con su localidad y coordenadas). |
| `siniestros` | Fecha y hora, lugar, coordenadas, gravedad, clase, tipo de vehículo y, si hubo víctimas, sexo y edad. |
| `conteos_usuarios` | Usuarios por día, localidad, tipo de vehículo y fuente (`camaras` o `app`). |
| `reportes` | Reportes ciudadanos con categoría; si `motivo_falso_positivo` tiene valor, es un falso positivo. |
| `activaciones_panico` | Activaciones del botón de pánico con fecha, lugar y coordenadas. |
| `ciclovias_fuente` | **Compartida.** El JSON de OpenStreetMap completo, tal cual, con su fecha de corte. |
| `ciclovias` | **Compartida.** Una fila por vía (2.448): `tipo` (`ciclovia` o `cruce`), nombre, etiquetas de OpenStreetMap, nodos, coordenadas, `riesgo` (vacío hasta calcularlo) y el rectángulo que la contiene (`min_lat`, `min_lon`, `max_lat`, `max_lon`). |

Las tablas del tablero las lee solo el dashboard; las dos de ciclovías las leen el dashboard y la app móvil.

Los scripts están en `infra/postgres/`: `01-esquema.sql` crea las tablas del tablero, `02-datos.sql` genera unos 20 meses de datos de prueba (desde el 1 de enero del año pasado hasta el día en que se crea la base) y `03-ciclovias.sql` carga `datos/ciclovias-osm.json`. Solo se ejecutan cuando el volumen está vacío. Para **borrar todo y volver a cargarlo**: `docker compose down -v` y luego `docker compose up -d`.

**Actualizar las ciclovías con un JSON nuevo** (sin tocar los demás datos): reemplaza `infra/postgres/datos/ciclovias-osm.json` por el nuevo export de Overpass (con `out geom`, para que traiga `bounds` y `geometry`) y corre:

```bash
docker compose exec postgres psql -U safepath -d safepath -f /docker-entrypoint-initdb.d/03-ciclovias.sql
```

## 4. Endpoints del tablero

Todos son `GET`, cuelgan de `http://localhost:3000/api/dashboard/v1/tablero` y responden JSON en `snake_case`. No piden token.

**Filtros** (query string, todos opcionales; los mismos para cualquier endpoint):

| Parámetro | Ejemplo | Qué hace |
|---|---|---|
| `mes_desde`, `mes_hasta` | `2026-08`, `2026-10` | Rango de meses (formato `AAAA-MM`). Sin ellos: los últimos 3 meses hasta el mes actual. |
| `localidad_id` | `4` | Una localidad (los ids salen de `/filtros`). |
| `tipo_vehiculo` | `bicicleta` | `bicicleta`, `bicicleta_electrica`, `patineta_electrica`, `patineta` u `otro`. Aplica a siniestros y usuarios. |
| `fuente` | `camaras` | `camaras` o `app`. Aplica solo a usuarios (es el selector *Cámaras / App* de su gráfica). |

Un filtro mal escrito responde `400` con el motivo.

| Parte del mockup | Endpoint | Qué devuelve |
|---|---|---|
| Selectores de filtros | `/filtros` | `localidades` (`id`, `nombre`), `tipos_vehiculo`, `fuentes` |
| Tarjeta Siniestros | `/tarjetas/siniestros` | `valor`, `valor_periodo_anterior`, `variacion_porcentual`, `serie_semanal` (para la minigráfica) |
| Tarjeta Usuarios de micromovilidad | `/tarjetas/usuarios` | igual que la anterior |
| Tarjeta Reportes | `/tarjetas/reportes` | igual que la anterior |
| Tarjeta Botón de pánico | `/tarjetas/boton-panico` | igual que la anterior |
| Tarjeta Falsos positivos | `/tarjetas/falsos-positivos` | igual que la anterior, más `porcentaje_de_reportes` |
| Mapa de siniestros | `/mapa-siniestros` | `siniestros` (puntos con `gravedad`, `clase`, `tipo_vehiculo`, `ocurrido_en`). Las ciclovías del mapa salen de `/api/dashboard/v1/ciclovias` (ver sección 5). |
| Lugares con más siniestros | `/lugares-con-mas-siniestros` | Top 5: `posicion`, `lugar`, `localidad`, `franja_pico`, `total` |
| Siniestros por hora del día | `/siniestros-por-hora` | 24 barras: `hora`, `franja`, `total` |
| Tendencia mensual | `/tendencia-mensual` | `anio_actual`, `anio_anterior`, `meses_filtrados` y 12 `meses` con `total_anio_actual` y `total_anio_anterior` (`null` si el mes aún no tiene datos) |
| Siniestros por sexo y edad | `/siniestros-por-sexo-y-edad` | `total_mujer`, `total_hombre` y `rangos` (`0-17` … `60+`) con `mujer` y `hombre` |
| Usuarios por tipo | `/usuarios-por-tipo?fuente=camaras` | `total` y `tipos` (`tipo_vehiculo`, `total`) |
| Botón de pánico | `/boton-panico` | `total`, `lugares` (círculos del mapa con coordenadas y `total`) y `top_ubicaciones` (las 5 primeras) |
| Reportes | `/reportes` | `total`, `puntos` (mapa) y `por_categoria` |
| Falsos positivos | `/falsos-positivos` | `total`, `porcentaje_de_reportes`, `por_motivo` (`motivo`, `total`, `porcentaje`) y `evolucion_mensual` (12 meses) |

Las franjas horarias son `madrugada` (0–6), `manana` (6–12), `tarde` (12–18) y `noche` (18–24).
La API acepta peticiones desde otro origen (CORS), así que el frontend puede llamarla desde su propio puerto. Para limitarlo a una sola dirección, pon `CORS_ORIGIN=http://localhost:5173` (o la que corresponda) en `.env`.

## 5. Endpoint de ciclovías (dashboard y app móvil)

Un mismo caso de uso (`src/common/modules/ciclovias/`) con una puerta en cada BFF. Devuelve solo las vías que tocan la parte del mapa que el usuario ve en pantalla, para no mandar la ciudad completa en cada petición.

| Producto | Endpoint | Parámetros |
|---|---|---|
| Dashboard | `GET /api/dashboard/v1/ciclovias` | `min_lat`, `min_lon`, `max_lat`, `max_lon` (obligatorios) y `tipo` (opcional) |
| App móvil | `GET /api/mobile/v1/ciclovias` | `minLat`, `minLon`, `maxLat`, `maxLon` (obligatorios) y `tipo` (opcional) |

- Las cuatro esquinas son las del mapa visible (en Leaflet, `map.getBounds()`); se pide de nuevo cada vez que el usuario mueve el mapa o cambia el zoom.
- `tipo`: `ciclovia` o `cruce`. Sin él llegan los dos; cada vía trae su `tipo` para dibujar los cruces con otro estilo.
- Esquinas fuera del planeta, mínimo mayor que el máximo o parámetros de más responden `400`.

```bash
curl "http://localhost:3000/api/mobile/v1/ciclovias?minLat=4.66&minLon=-74.06&maxLat=4.68&maxLon=-74.04"
```

Respuesta (recortada):

```json
{"total":34,"ciclovias":[{"id":24437178,"tipo":"ciclovia","nombre":null,"riesgo":null,"nodos":[265596896,12596010822],"coordenadas":[[4.6729127,-74.0539053],[4.6728981,-74.0538459]]}]}
```

| Campo | Qué es |
|---|---|
| `total` | Cuántas vías tocan la zona. |
| `id` | Id de la vía en OpenStreetMap. |
| `tipo` | `ciclovia` o `cruce`. |
| `nombre` | Nombre de la vía; `null` si OpenStreetMap no lo tiene (la mayoría). |
| `riesgo` | `null` hasta que se calcule (luego `bajo`, `medio` o `alto`). |
| `nodos` | Ids de OpenStreetMap de cada punto; un mismo id en dos vías significa que se conectan. |
| `coordenadas` | Puntos de la línea como `[latitud, longitud]`, en el mismo orden que `nodos` (se dibujan directo con `L.polyline`). |

Los datos son de © OpenStreetMap (licencia ODbL): el mapa debe mostrar ese crédito.

## 6. Diagrama

```
            DASHBOARD                                   APP MÓVIL
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
        Lo que leen los dos (ciclovías) vive en src/common/modules/
        y cada BFF lo usa solo por su index.ts.
```

## 7. Hexagonal y BFF en pocas palabras

**Hexagonal.** El negocio (dominio y casos de uso) vive en el centro y no sabe nada de bases de datos ni de HTTP.
Para hablar con el exterior define **puertos** (interfaces); afuera, los **adaptadores** los implementan.
Analogía: un enchufe en la pared. La casa define la forma del enchufe (puerto) y cualquier aparato compatible (adaptador) se conecta.
Así cambiamos el repositorio en memoria por PostgreSQL sin tocar el negocio.

**BFF (Backend For Frontend).** Cada cliente tiene su propia puerta HTTP adaptada a lo que necesita.
El BFF solo recibe la petición, la valida, llama al caso de uso y da forma a la respuesta.
Analogía: un mesero por tipo de cliente. La cocina (el negocio) es la misma; cada mesero sirve el plato como lo pide su mesa.
Por eso el dashboard responde en `snake_case` y el móvil en `camelCase`, sin afectarse entre ellos.

## 8. Reglas de dependencia

`npm run lint` falla si alguna se rompe.

| Carpeta | Import permitido | Import prohibido |
|---|---|---|
| `domain/` | `import { DomainError } from '../../../../shared/domain-error'` | `import { Injectable } from '@nestjs/common'` |
| `application/` | `import { Usuario } from '../domain/usuario'` | `import { InMemoryUsuarioRepository } from '../infrastructure/...'` |
| `infrastructure/` | `import { Injectable } from '@nestjs/common'` | cualquier archivo de `bff/` |
| `dashboard/bff/` | `import { LoginUseCase } from '../../modules/auth'` (su `index.ts`) | `import { LoginUseCase } from '../../modules/auth/application/login.use-case'` |
| `dashboard/bff/` y `mobile/bff/` | `import { ObtenerCicloviasUseCase } from '../../../common/modules/ciclovias'` (su `index.ts`) | `import { ... } from '../../../common/modules/ciclovias/application/...'` |
| `dashboard/` ↔ `mobile/` | — | `import { SosModule } from '../../../mobile/modules/sos'` |
| `platform/` | `import { DomainError } from '../../shared/domain-error'` | cualquier archivo de `dashboard/` o `mobile/` |

## 9. Recorrido del login

1. `src/dashboard/bff/controllers/auth.controller.ts` recibe `POST /api/dashboard/v1/auth/login` y valida el cuerpo con `src/dashboard/bff/dto/login.request.ts`.
2. Llama a `LoginUseCase` a través de `src/dashboard/modules/auth/index.ts` (la única puerta del módulo).
3. `src/dashboard/modules/auth/application/login.use-case.ts` busca el usuario y compara la contraseña con la entidad `Usuario` (`domain/usuario.ts`).
4. Para buscar el usuario usa el puerto `UsuarioRepositoryPort` (`application/usuario.repository.port.ts`).
5. `auth.module.ts` conecta ese puerto con `InMemoryUsuarioRepository` (`infrastructure/in-memory-usuario.repository.ts`).
6. Si algo falla, el caso de uso lanza `CredencialesInvalidasError`; el controlador la convierte en `401`. Si sale bien, responde en `snake_case`.

## 10. Cómo agregar una funcionalidad nueva

1. **Dominio**: crea la entidad y sus errores en `modules/<modulo>/domain/` (TypeScript puro).
2. **Aplicación**: crea el caso de uso (`<accion>.use-case.ts`, con `execute()`) y su puerto con token `Symbol` en `application/`.
3. **Infraestructura**: implementa el puerto en `infrastructure/` (en memoria al principio).
4. **Módulo**: en `<modulo>.module.ts` conecta `{ provide: PUERTO, useClass: Adaptador }` y exporta el caso de uso desde `index.ts`.
5. **BFF**: agrega el DTO y el controlador en `<producto>/bff/`, regístralo en `<producto>-bff.module.ts` y corre `npm run lint && npm run build && npm run test`.

## 11. Hoja de ruta

| Pendiente | Dónde va |
|---|---|
| JWT, guards y roles (reemplaza `token-de-prueba`) | `src/platform/auth/` |
| Multi-tenant (una base de datos por entidad) | `src/platform/tenancy/` |
| MongoDB y PostgreSQL para el resto de módulos (el tablero ya usa PostgreSQL) | `src/platform/database/` + `infrastructure/` de cada módulo |
| Eventos con RabbitMQ (por ejemplo, reportes del móvil hacia el dashboard) | `src/platform/messaging/` |
| Caché con Redis | `src/platform/cache/` |
| Usuarios del dashboard y botón *Exportar* del tablero | `src/dashboard/modules/users/` y `kpis/` |
| Calcular el `riesgo` de cada ciclovía (por ejemplo, con los siniestros cercanos) | `src/common/modules/ciclovias/` + columna `riesgo` de `ciclovias` |
| Reportes y SOS de la app móvil, y su BFF | `src/mobile/modules/` y `src/mobile/bff/` |
| Activar `mongo`, `redis` y `rabbitmq` | Descomentarlos en `docker-compose.yml` cuando exista su adaptador |
| Compose de otros entornos y Nginx | `infra/docker/` y `infra/nginx/` |

## 12. Glosario

- **Entidad**: objeto del negocio con sus reglas (por ejemplo, `Usuario`).
- **Caso de uso**: una acción del negocio, con un método `execute()` (por ejemplo, `LoginUseCase`).
- **Puerto**: interfaz que el negocio necesita para hablar con el exterior (por ejemplo, `UsuarioRepositoryPort`).
- **Adaptador**: implementación concreta de un puerto (por ejemplo, `InMemoryUsuarioRepository`).
- **DTO**: forma de los datos que entran o salen por HTTP (por ejemplo, `LoginRequest`).
- **BFF**: la puerta HTTP propia de cada producto.

## 13. Más detalle

El mapa completo de carpetas y archivos está en [`estructura.md`](estructura.md).
