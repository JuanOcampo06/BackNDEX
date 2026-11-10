# Backend Safe Path Twin

Un solo backend (NestJS + TypeScript) con **arquitectura hexagonal** y **BFF**, dividido en dos productos.
Hoy incluye el **login de demostración** del dashboard, los **endpoints de cada tarjeta y gráfica del tablero** los **endpoints de la app móvil** (registro y login con JWT, reportes ciudadanos, rutas segura, equilibrada y rápida, botón de pánico y viajes en bicicleta) y un endpoint de **ciclovías por zona del mapa** que comparten el dashboard y la app móvil. Todo lee de una base de datos **PostgreSQL local**.

## 1. Qué es el backend

| Producto | Qué es | Quién se encarga |
|---|---|---|
| **Dashboard** | Tablero institucional que usa el personal de la entidad. | `src/dashboard/`, con su puerta HTTP en `/api/dashboard/v1`. |
| **App móvil** | App ciudadana: registro y login, reportes, rutas, botón de pánico, viajes y ciclovías. | `src/mobile/`, con su puerta HTTP en `/api/mobile/v1`. |
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

`.env` guarda la configuración de tu máquina y **no se sube al repositorio**. Los valores por defecto sirven tal cual: puerto `3001` para la API, `5432` para PostgreSQL y `8081` para Adminer, con usuario, contraseña y base `safepath`.

### Opción A: con Docker (la más fácil)

Abre Docker Desktop y espera a que diga que está corriendo. Luego:

```bash
docker compose up -d --build     # construye la imagen y arranca api, postgres y adminer
docker compose ps                # api y postgres deben decir "(healthy)" (tarda unos segundos)
docker compose logs -f api       # ver los logs (Ctrl + C para salir)
docker compose down              # apagarlo cuando termines (los datos se conservan)
```

La primera vez, PostgreSQL crea las tablas y carga solo los datos del **Anuario de Siniestralidad Vial 2025** y los usuarios del dashboard (scripts de `infra/postgres/`).

### Opción B: sin Docker para la API

La API necesita una base de datos PostgreSQL. Lo más fácil es levantar solo esa parte con Docker:

```bash
docker compose up -d postgres adminer
npm install
npm run start:dev
```

Para firmar los tokens de la app móvil la API necesita `JWT_SECRET`: ya viene en `.env.example`, así que basta con copiarlo a `.env`. En producción debe ser largo y distinto para cada entorno.

Si prefieres tu propio PostgreSQL instalado, crea la base y carga los scripts (ajusta `DATABASE_URL` en `.env` si usas otro usuario):

```bash
psql -U postgres -c "CREATE USER safepath PASSWORD 'safepath'" -c "CREATE DATABASE safepath OWNER safepath"
psql -U safepath -d safepath -f infra/postgres/01-esquema.sql
psql -U safepath -d safepath -v carpeta=infra/postgres -f infra/postgres/02-datos.sql
psql -U safepath -d safepath -v carpeta=infra/postgres -f infra/postgres/03-ciclovias.sql
npm install
npm run start:dev
```

Está listo cuando la consola muestra `Nest application successfully started`. Déjala abierta y usa otra terminal para probar.

### Comprobar que funciona

Funciona igual con la opción A o la B (puerto 3001).

```bash
curl http://localhost:3001/api/health
```

Respuesta esperada: `{"status":"ok"}`

```bash
curl.exe -X POST http://localhost:3001/api/dashboard/v1/auth/login -H "Content-Type: application/json" -d "{\`"email\`":\`"admin@demo.local\`",\`"password\`":\`"demo1234\`"}"
```

Respuesta esperada:

```json
{"access_token":"token-de-prueba","user":{"id":"1","full_name":"Admin Demo","email":"admin@demo.local","role":"admin"}}
```

Con una contraseña errónea:

```bash
curl.exe -X POST http://localhost:3001/api/dashboard/v1/auth/login -H "Content-Type: application/json" -d "{\`"email\`":\`"admin@demo.local\`",\`"password\`":\`"incorrecta\`"}"
```

Respuesta esperada (código `401`): `{"codigo":"CREDENCIALES_INVALIDAS","mensaje":"Correo o contraseña incorrectos"}`

**Desde PowerShell** (allí `curl` es otro comando; usa `Invoke-RestMethod`):

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/dashboard/v1/auth/login -ContentType "application/json" -Body '{"email":"admin@demo.local","password":"demo1234"}'
```

Un endpoint del tablero:

```bash
curl "http://localhost:3001/api/dashboard/v1/tablero/tarjetas/siniestros?mes_desde=2025-10&mes_hasta=2025-12"
```

Respuesta esperada (siniestros del último trimestre del anuario 2025 comparados con el trimestre anterior; la serie semanal viene recortada):

```json
{"valor":2832,"valor_periodo_anterior":2958,"variacion_porcentual":-4.3,"serie_semanal":[{"semana":"2025-09-29","total":169}]}
```

**Con Swagger (en el navegador)**: abre http://localhost:3001/api/docs. Ahí están los 39 endpoints agrupados en este orden: compartidos, dashboard y app móvil; en cada uno pulsa *Try it out* y luego *Execute*. Los parámetros y cuerpos ya traen ejemplos; para ver cifras del anuario en el tablero usa `mes_desde=2025-01` y `mes_hasta=2025-12`. El documento en JSON (para importarlo en Postman o en el frontend) está en http://localhost:3001/api/docs-json.

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
| `EADDRINUSE` o "port is already allocated" (puerto 3001 ocupado) | Cambia `PORT` en `.env` (por ejemplo `PORT=3002`), vuelve a arrancar y usa ese puerto en los `curl`. |
| `Cannot connect to the Docker daemon` o `failed to connect to the docker API` | Docker no está corriendo: abre Docker Desktop y espera a que inicie. |
| `npm install` avisa `EBADENGINE` o la app no arranca | Node es muy viejo: `node -v` debe ser `v22` o más. Instala la versión LTS. |
| Cambiaste `PORT` pero la API sigue en el 3001 | Falta `.env` (o editaste `.env.example`): créalo con `cp .env.example .env` (o `copy` en Windows) y cambia el puerto ahí. |
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

Es **una sola base** (`safepath`) dividida en **tres esquemas** según quién usa cada tabla. En Adminer se cambia de esquema con el selector *Schema*.

```
            APP MÓVIL                                   DASHBOARD
  escribe reportes, activaciones y conteos     lee esas mismas tablas para sus gráficas
               │                                            │
               ▼                                            ▼
   ┌──────────────────────── compartido ────────────────────────┐
   │ reportes  activaciones_panico  conteos_usuarios              │
   │ subcategorias_reporte  localidades  lugares  ciclovias       │
   └─────────────────────────────────────────────────────────────┘
        movil (solo la app)                 dashboard (solo el tablero)
        usuarios (ciudadanos)               usuarios, siniestros, actores_viales
```

**`compartido`**: lo que usan los dos productos.

| Tabla | Qué guarda |
|---|---|
| `compartido.reportes` | **Tabla maestra** de reportes ciudadanos: la app los crea y el dashboard los lee. Autor (`usuario_id` → `movil.usuarios`), lugar, `categoria` principal y `subcategoria` (la base no acepta una subcategoría de otra categoría), descripción, coordenadas, `estado` (`recibido`, `en_revision`, `resuelto`, `descartado`) y fecha. Un reporte `descartado` es un **falso positivo** y siempre lleva su `motivo_falso_positivo`: la base no acepta uno sin el otro. |
| `compartido.activaciones_panico` | **Tabla maestra** del botón de pánico: la app las crea y el dashboard las lee. Autor, lugar, coordenadas, `estado` (`activa`, `atendida`, `cancelada`) y fecha. |
| `compartido.conteos_usuarios` | Usuarios de micromovilidad por día, localidad y tipo de vehículo: la app los cuenta y el dashboard los lee. **Vacía** hasta que la app empiece a contarlos. |
| `compartido.subcategorias_reporte` | Catálogo de las categorías y subcategorías de reporte que muestra la app (tabla siguiente). |
| `compartido.localidades` | Las 20 localidades de Bogotá del filtro *Localidad*. El `id` es el código oficial (1 Usaquén … 8 Kennedy … 20 Sumapaz). |
| `compartido.lugares` | Las 8.608 direcciones del anuario, con su localidad y el punto medio de sus siniestros. Sirven para ubicar siniestros, reportes y activaciones. |
| `compartido.ciclovias_fuente` | El JSON de OpenStreetMap completo, tal cual, con su fecha de corte. |
| `compartido.ciclovias` | Una fila por vía (2.448): `tipo` (`ciclovia` o `cruce`), nombre, etiquetas de OpenStreetMap, nodos, coordenadas, `riesgo` (vacío hasta calcularlo) y el rectángulo que la contiene (`min_lat`, `min_lon`, `max_lat`, `max_lon`). |

**`dashboard`**: solo del tablero.

| Tabla | Qué guarda |
|---|---|
| `dashboard.usuarios` | Usuarios del dashboard: nombre, correo (único, en minúsculas) y `rol` (`admin` administra usuarios, `lector` solo consulta). No guarda contraseña todavía: llegará con el login real. |
| `dashboard.siniestros` | Los 11.573 siniestros del anuario 2025: código del anuario como `id`, fecha y hora, lugar (dirección), localidad, coordenadas, gravedad, clase y tipo de vehículo. |
| `dashboard.actores_viales` | Las 28.029 personas de esos siniestros: condición (`conductor`, `motociclista`, `ciclista`, `pasajero`, `peaton`), gravedad (`ileso`, `herido`, `muerto`), sexo y edad. |

**`movil`**: solo de la app.

| Tabla | Qué guarda |
|---|---|
| `movil.usuarios` | Ciudadanos de la app (nombre, correo único, teléfono, `fecha_nacimiento`, `genero` y `contrasena_cifrada`). Son los autores de los reportes, activaciones y viajes: la base no deja borrar uno que tenga registros. La contraseña se guarda cifrada con scrypt y nunca en texto plano. **Vacía**: no hay ciudadanos de prueba, se crean con `POST /auth/register`. |
| `movil.viajes` | Viajes en bicicleta del ciudadano: `estado` (`en_curso` o `finalizado`), `distancia_m` (metros recorridos, se calcula al finalizar) y fechas. Un índice único en la base garantiza **un solo viaje en curso por ciudadano**. |
| `movil.puntos_viaje` | Puntos GPS del recorrido de cada viaje; el primero es la salida. Se borran junto con su viaje. |

**Cómo se ubica un evento de la app.** La app solo manda latitud y longitud. Al guardar, la base le asigna el **lugar conocido más cercano** (función `compartido.lugar_mas_cercano`), y ese lugar trae su localidad. Así el dashboard puede filtrar por localidad y agrupar el botón de pánico por ubicación.

Cada producto lee y escribe con sus propios adaptadores (`infrastructure/`); ninguno importa código del otro. Todos usan la misma conexión (`DATABASE_URL`) y escriben el esquema delante de cada tabla (por ejemplo `compartido.reportes`).

Los scripts están en `infra/postgres/` y solo se ejecutan cuando el volumen está vacío:

- **`01-esquema.sql`** crea los tres esquemas, sus tablas, restricciones e índices.
- **`02-datos.sql`** carga las 20 localidades y el **Anuario de Siniestralidad Vial 2025** desde `datos/anuario-siniestros.csv` y `datos/anuario-actores-viales.csv`, y crea los 3 usuarios del dashboard (los únicos datos de prueba, para el login). No hay datos inventados: **reportes, botón de pánico, falsos positivos, conteos de usuarios y ciudadanos de la app quedan en cero** hasta que existan datos reales.

**Datos del anuario.** Los dos CSV son las columnas que usa la base, copiadas tal cual del Excel del anuario (hojas *Siniestros* y *Actor vial*); `02-datos.sql` hace la conversión:

| Anuario | Base |
|---|---|
| `Codigo_Siniestro`, `Fecha_Siniestro` + `Hora_Siniestro` + `Min_Siniestro` | `siniestros.id`, `ocurrido_en` |
| `Localidad` (`KENNEDY`, `ENGATIVÁ`…) | `localidad_id` con el código oficial (un siniestro del anuario no trae localidad y sale como *Sin localidad*) |
| `Latitud`, `Longitud` con coma decimal | `latitud`, `longitud` |
| `Gravedad_indicador_30d`: `Con Muertos`, `Con Heridos` | `gravedad`: `con_muertos`, `con_heridos` |
| `Clase_Siniestro`: `Choque`, `Atropello`, `Caida de ocupante`, `Volcamiento`, `Otro` | `clase`: `choque`, `atropello`, `caida`, `volcamiento`, `otro` |
| `Con_Bicicleta` = `SI` | `tipo_vehiculo` = `bicicleta`; los demás quedan en `otro` (el anuario no distingue bicicleta eléctrica ni patinetas, así que esos tipos dan cero) |
| *Actor vial*: `Condicion`, `Gravedad_Indicador_30d`, `Sexo`, `Edad` | `actores_viales`; la gráfica de sexo y edad cuenta los heridos y muertos que traen sexo y edad |

Para cargar un anuario nuevo, exporta esas mismas columnas a los dos CSV y vuelve a crear la base (`docker compose down -v`).
- **`03-ciclovias.sql`** carga `datos/ciclovias-osm.json`.

Para **borrar todo y volver a cargarlo**: `docker compose down -v` y luego `docker compose up -d`.

**Actualizar las ciclovías con un JSON nuevo** (sin tocar los demás datos): reemplaza `infra/postgres/datos/ciclovias-osm.json` por el nuevo export de Overpass (con `out geom`, para que traiga `bounds` y `geometry`) y corre:

```bash
docker compose exec postgres psql -U safepath -d safepath -f /docker-entrypoint-initdb.d/03-ciclovias.sql
```

## 4. Endpoints del tablero

Todos son `GET`, cuelgan de `http://localhost:3001/api/dashboard/v1/tablero` y responden JSON en `snake_case`. No piden token.

**Filtros** (query string, todos opcionales; los mismos para cualquier endpoint):

| Parámetro | Ejemplo | Qué hace |
|---|---|---|
| `mes_desde`, `mes_hasta` | `2025-01`, `2025-12` | Rango de meses (formato `AAAA-MM`). Sin ellos: los últimos 3 meses **hasta el último mes que tiene datos** en las fuentes elegidas (hoy, octubre a diciembre de 2025), así el tablero nunca abre vacío. Si llega solo `mes_desde`, el final es el mes actual. |
| `localidad_id` | `8` o `8,10` | Una o varias localidades (los ids salen de `/filtros`). |
| `tipo_vehiculo` | `bicicleta` o `bicicleta,patineta` | Uno o varios de: `bicicleta`, `bicicleta_electrica`, `patineta_electrica`, `patineta`, `otro`. Aplica a siniestros y usuarios. |
| `fuente` | `anuario` o `anuario,app` | Una o las dos: `anuario` (Anuario de Siniestralidad de la Secretaría de Movilidad) y `app` (app móvil). Cada gráfica tiene su fuente: **anuario** → tarjeta de siniestros, mapa, lugares, horas, tendencia y sexo y edad; **app** → usuarios, reportes, botón de pánico y falsos positivos. Las gráficas de una fuente no elegida responden en cero. Sin `fuente`, o con las dos, salen todas combinadas. |

**Varios valores en un filtro.** `localidad_id`, `tipo_vehiculo` y `fuente` aceptan uno o varios valores, repetidos o separados por comas (también se pueden mezclar):

```
?tipo_vehiculo=bicicleta&tipo_vehiculo=patineta&localidad_id=8,10
```

- Dentro de un filtro los valores se suman (**o**): `bicicleta,patineta` trae siniestros de bicicleta **o** de patineta.
- Entre filtros distintos se combinan (**y**): el ejemplo trae los de las localidades 8 **o** 10, y de esas, los de bicicleta **o** patineta.
- Un solo valor funciona igual que siempre.
- Los **meses** son un rango continuo (`mes_desde` a `mes_hasta`): para ver dos meses seguidos, `mes_desde=2025-08&mes_hasta=2025-09`.
- Los mismos filtros sirven en `/tablero/exportar`, donde la hoja *Filtros aplicados* los muestra separados por coma.

Un filtro mal escrito responde `400` con el motivo, y basta con que **uno** de los valores de la lista sea inválido.

| Parte del mockup | Endpoint | Qué devuelve |
|---|---|---|
| Selectores de filtros | `/filtros` | `localidades` (`id`, `nombre`), `tipos_vehiculo` y `fuentes` |
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
| Usuarios por tipo | `/usuarios-por-tipo` | `total` y `tipos` (`tipo_vehiculo`, `total`) |
| Botón de pánico | `/boton-panico` | `total`, `lugares` (círculos del mapa con coordenadas y `total`) y `top_ubicaciones` (las 5 primeras) |
| Reportes | `/reportes` | `total`, `puntos` (mapa) y `por_categoria` |
| Falsos positivos | `/falsos-positivos` | `total`, `porcentaje_de_reportes`, `por_motivo` (`motivo`, `total`, `porcentaje`) y `evolucion_mensual` (12 meses) |

Las franjas horarias son `madrugada` (0–6), `manana` (6–12), `tarde` (12–18) y `noche` (18–24).
La API acepta peticiones desde otro origen (CORS), así que el frontend puede llamarla desde su propio puerto. Para limitarlo a una sola dirección, pon `CORS_ORIGIN=http://localhost:5173` (o la que corresponda) en `.env`.

### Exportar KPIs a Excel (botón *Exportar*)

`GET /api/dashboard/v1/tablero/exportar` descarga un archivo `.xlsx` con los KPIs que el usuario elija. Usa los **mismos filtros** que el resto del tablero (`mes_desde`, `mes_hasta`, `localidad_id`, `tipo_vehiculo`, `fuente`) y los mismos casos de uso, así que las cifras del Excel son exactamente las de la pantalla.

El parámetro `kpis` es obligatorio y se puede mandar repetido (`?kpis=a&kpis=b`) o separado por comas (`?kpis=a,b`):

| KPI (`kpis=`) | Hoja que genera | Qué trae |
|---|---|---|
| `tarjeta_siniestros` | Tarjeta Siniestros | Valor, período anterior, variación y serie semanal |
| `tarjeta_usuarios` | Tarjeta Usuarios | Igual que la anterior |
| `tarjeta_reportes` | Tarjeta Reportes | Igual que la anterior |
| `tarjeta_boton_panico` | Tarjeta Botón de pánico | Igual que la anterior |
| `tarjeta_falsos_positivos` | Tarjeta Falsos positivos | Igual que la anterior más el % de los reportes |
| `mapa_siniestros` | Mapa de siniestros | Un siniestro por fila: fecha, coordenadas, gravedad, clase y vehículo |
| `lugares_con_mas_siniestros` | Lugares con más siniestros | Top 5 con su franja pico |
| `siniestros_por_hora` | Siniestros por hora | Las 24 horas con su franja |
| `tendencia_mensual` | Tendencia mensual | Los 12 meses del año actual contra el anterior |
| `siniestros_por_sexo_y_edad` | Siniestros por sexo y edad | Totales y por rango de edad |
| `usuarios_por_tipo` | Usuarios por tipo | Total y por tipo de vehículo |
| `boton_panico` | Botón de pánico | Total y activaciones por lugar |
| `reportes` | Reportes | Total, por categoría y cada reporte del mapa |
| `falsos_positivos` | Falsos positivos | Total, por motivo y evolución mensual |

El archivo siempre trae una primera hoja **Filtros aplicados** (período, localidad, vehículo y fuente usados, y las hojas incluidas), y después una hoja por KPI, en el orden de la tabla anterior aunque se pidan desordenados. Se llama `kpis_<mes desde>_<mes hasta>.xlsx`.

```bash
curl -o kpis.xlsx "http://localhost:3001/api/dashboard/v1/tablero/exportar?kpis=tarjeta_siniestros&kpis=siniestros_por_hora&mes_desde=2025-08&mes_hasta=2025-10"
```

Errores (`400`): falta `kpis`, algún KPI no existe, un filtro es inválido o el rango de meses está al revés. La API expone la cabecera `Content-Disposition` por CORS, así que el frontend puede leer el nombre del archivo; si hace `fetch`, recibe el archivo con `respuesta.blob()`. En Swagger el resultado aparece como un enlace *Download file*.

### Usuarios del dashboard

Cuelgan de `http://localhost:3001/api/dashboard/v1/usuarios` y responden en `snake_case`. Todavía no piden token: los roles se harán cumplir cuando exista el login con JWT.

| Método y ruta | Para qué | Datos que recibe |
|---|---|---|
| `GET /usuarios` | Listar usuarios | Opcional: `?rol=admin` o `?rol=lector` |
| `GET /usuarios/:id` | Ver un usuario | — |
| `POST /usuarios` | Crear un usuario (`201`) | Cuerpo: `nombre_completo`, `correo`, `rol` |
| `PATCH /usuarios/:id` | Editar nombre, correo o rol (solo los campos que se envíen) | Cuerpo: cualquiera de `nombre_completo`, `correo`, `rol` |
| `DELETE /usuarios/:id` | Eliminar un usuario (`204`, sin cuerpo) | — |

Errores: datos inválidos o `PATCH` sin campos responden `400`; un id que no existe, `404`; un correo que ya usa otro usuario, `409` con `{"codigo":"CORREO_DUPLICADO",...}`.

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
curl "http://localhost:3001/api/mobile/v1/ciclovias?minLat=4.66&minLon=-74.06&maxLat=4.68&maxLon=-74.04"
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

## 6. Endpoints de la app móvil

Todos cuelgan de `http://localhost:3001/api/mobile/v1` y responden en `camelCase`. Los reportes y activaciones se guardan en las tablas maestras del esquema `compartido`, así que **aparecen de inmediato en las gráficas del dashboard**.

**Sesión y token.** `POST /auth/register` y `POST /auth/login` entregan un `accessToken` (JWT firmado con `JWT_SECRET`, dura 7 días). Todas las rutas de `/reports`, `/sos` y `/trips` lo piden en el encabezado `Authorization: Bearer <token>` y **el ciudadano sale del token**: ya no se manda `usuarioId` en el cuerpo ni en la url, y cada ciudadano ve y modifica solo lo suyo. Sin token, o con uno inválido o vencido, responde `401` con `TOKEN_INVALIDO`. `/auth/*` y `/ciclovias` no piden token. `/routes` sí lo pide, igual que `/trips`. **No hay ciudadanos de prueba**: crea uno con `/auth/register`.

| Método y ruta | Para qué | Datos que recibe |
|---|---|---|
| `POST /auth/register` | Crear la cuenta del ciudadano y dejarlo con sesión abierta (201) | Cuerpo: `nombreCompleto`, `correo`, `contrasena` (8 a 72 caracteres), `fechaNacimiento` (`AAAA-MM-DD`, mayor de 18 años) y `genero` (`femenino`, `masculino`, `no_binario` o `prefiero_no_decirlo`); `telefono` es opcional (7 a 15 dígitos) |
| `POST /auth/login` | Iniciar sesión (200) | Cuerpo: `correo` y `contrasena` |
| `POST /reports` 🔒 | Crear un reporte ciudadano (nace `recibido`) | Cuerpo: `categoria`, `subcategoria`, `latitud`, `longitud` y `descripcion` opcional (máx. 500) |
| `GET /reports` 🔒 | Listar **mis** reportes, los más recientes primero (máx. 100) | Opcionales: `?categoria=seguridad&subcategoria=robo` |
| `GET /reports/:id` 🔒 | Ver uno de mis reportes | — |
| `GET /routes` 🔒 | Calcular la **ruta segura**, la **equilibrada** y la **rápida** entre dos puntos | Obligatorios: `?origenLat=4.6486&origenLon=-74.0818&destinoLat=4.6702&destinoLon=-74.0623` |
| `POST /sos` 🔒 | Activar el botón de pánico (nace `activa`) | Cuerpo: `latitud`, `longitud` |
| `GET /sos` 🔒 | Listar **mis** activaciones, las más recientes primero (máx. 100) | Opcional: `?estado=activa` |
| `PATCH /sos/:id/cancelar` 🔒 | Cancelar una de mis activaciones que sigue activa | — |
| `POST /trips` 🔒 | Iniciar un viaje desde la ubicación actual (201, nace `en_curso`) | Cuerpo: `latitud`, `longitud` |
| `POST /trips/:id/puntos` 🔒 | Agregar un punto GPS al recorrido de un viaje en curso (201) | Cuerpo: `latitud`, `longitud` |
| `PATCH /trips/:id/finalizar` 🔒 | Cerrar el viaje y calcular los metros recorridos | — |
| `GET /trips` 🔒 | Listar **mis** viajes, los más recientes primero (máx. 100) | — |
| `GET /trips/:id` 🔒 | Ver uno de mis viajes con todo su recorrido (`puntos`) | — |
| `GET /ciclovias` | Ciclovías de la zona del mapa (ver sección 5) | `minLat`, `minLon`, `maxLat`, `maxLon` y `tipo` opcional |

**Categorías de reporte.** En la app el ciudadano elige primero la categoría principal y luego una de sus subcategorías; se guardan las dos. El dashboard **solo muestra la categoría principal**: en `/tablero/reportes` cada categoría suma todas sus subcategorías y siempre salen las cuatro, aunque alguna esté en cero.

| `categoria` (la que ve el dashboard) | `subcategoria` (la que elige el ciudadano en la app) |
|---|---|
| `danos_en_la_via` (Daños en la vía) | `hueco`, `obra`, `via_cerrada` |
| `transito` (Tránsito) | `accidente`, `semaforo_danado` |
| `seguridad` (Seguridad) | `robo`, `poca_luz`, `policia` |
| `otro` (Otro) | `otro` (la app no muestra opciones; el detalle va en `descripcion`) |

Una subcategoría que no es de su categoría (por ejemplo `seguridad` + `hueco`) responde `400` con `REPORTE_INVALIDO`.

🔒 = pide token.

**Rutas.** `GET /routes` devuelve `{ riesgoDisponible, rutas: [segura, equilibrada, rapida] }` (en ese orden, el mismo en que la app las muestra). Cada ruta trae `distanciaM`, `duracionS` (segundos estimados en bicicleta, a 15 km/h en ciclovía), `porcentajeEnCiclovia`, `coordenadas` (`[latitud, longitud]` desde el origen hasta el destino, para dibujarlas como una línea en el mapa) y `pasos` (la salida, cada giro `derecha`, `izquierda` o `giro_en_u`, y la llegada; cada paso trae su ubicación y `distanciaDesdeInicioM`, así que "en 1,6 km gira a la derecha" es ese valor menos lo que ya recorrió el ciudadano).

- **Cómo se calcula.** Las rutas van por la red de **ciclovías de OpenStreetMap** (`compartido.ciclovias`) con el algoritmo de Dijkstra. La **rápida** minimiza el tiempo, la **equilibrada** minimiza el promedio de las dos cosas y la **segura** minimiza los metros ponderados: la ciclovía cuenta 1, cruzar una calle 1,3 y ir por calle normal 1,6, y además un tramo de riesgo `medio` se multiplica por 1,6 y uno `alto` por 3.
- **Hoy las tres rutas casi no se distinguen.** Con los datos reales, la segura mide en mediana solo un 0,2 % más que la rápida y la equilibrada queda entre las dos. Ninguna ciclovía tiene riesgo calculado todavía (`riesgo` está vacío), así que la segura solo esquiva calles y cruces. La respuesta lo avisa con `riesgoDisponible: false`. Cuando se llene `compartido.ciclovias.riesgo` con `bajo`, `medio` o `alto`, la segura empieza a esquivar los tramos peligrosos sin cambiar nada del código (los datos nuevos llegan en menos de 10 minutos, sin reiniciar).
- **Límites.** Solo hay ruta si el origen y el destino están a menos de **600 metros** de una ciclovía (`RUTA_FUERA_DE_COBERTURA`) y si las ciclovías de los dos lados se conectan (`RUTA_SIN_CAMINO`). Las ciclovías de OpenStreetMap están en 209 grupos sueltos, así que se unen con tramos por calle normal cuando están a menos de 300 metros (enlaces en línea recta, no siguen la calle real). Con los datos reales de Bogotá, de 200 pares de puntos al azar entre 3 y 10 km, el **91 %** tuvo ruta, el recorrido midió en mediana **1,45 veces** la línea recta y cada consulta tardó unos 20 ms.
- Origen y destino a menos de 30 metros responden `400` con `RUTA_INVALIDA`.

**Viajes.** Un ciudadano tiene **un solo viaje en curso a la vez**: iniciar otro responde `409` (`VIAJE_EN_CURSO_DUPLICADO`). La distancia (`distanciaM`) vale 0 mientras el viaje está en curso; al finalizar se suman en línea recta (fórmula de haversine) los tramos entre los puntos GPS, en el orden en que se registraron. Agregar puntos o finalizar un viaje que ya terminó responde `400` (`VIAJE_INVALIDO`).

Errores: datos inválidos responden `400` (por ejemplo, una persona menor de 18 años responde `CIUDADANO_INVALIDO`); correo ya registrado `409` (`CORREO_DUPLICADO`); correo o contraseña incorrectos `401` (`CREDENCIALES_INVALIDAS`, el mismo mensaje para los dos casos); una ruta que no se puede calcular responde `400` con `RUTA_INVALIDA`, `RUTA_FUERA_DE_COBERTURA` o `RUTA_SIN_CAMINO`; un ciudadano, reporte, activación o viaje que no existe **o que es de otro ciudadano** responde `404` con `{"codigo":"..._NO_ENCONTRADO","mensaje":"..."}`; cancelar una activación que ya no está activa responde `400` con `SOS_INVALIDO`.

```bash
# 1. Crear la cuenta y guardar el token
curl -X POST http://localhost:3001/api/mobile/v1/auth/register -H "Content-Type: application/json" -d '{"nombreCompleto":"Ana Lopez","correo":"ana@demo.local","contrasena":"demo1234","fechaNacimiento":"1995-04-23","genero":"femenino"}'

# 2. Usar el accessToken que devolvió
curl -X POST http://localhost:3001/api/mobile/v1/reports -H "Content-Type: application/json" -H "Authorization: Bearer <accessToken>" -d '{"categoria":"danos_en_la_via","subcategoria":"hueco","descripcion":"Hueco","latitud":4.6486,"longitud":-74.0818}'
```

En Swagger pulsa **Authorize** (arriba a la derecha) y pega el `accessToken` para probar las rutas con 🔒.

**Si ya tenías la base creada**, el esquema nuevo no se aplica solo (Docker ejecuta los scripts únicamente al crear el volumen). Para empezar de cero: `docker compose down -v` y luego `docker compose up -d`. Esto borra los datos de la base.

## 7. Diagrama

```
            DASHBOARD                                   APP MÓVIL
  Cliente (frontend web)                       Cliente (app ciudadana)
          │  HTTP /api/dashboard/v1                    │  HTTP /api/mobile/v1
          ▼                                            ▼
  BFF dashboard (snake_case)                   BFF móvil (camelCase)
          │  solo por index.ts                         │  solo por index.ts
          ▼                                            ▼
  Caso de uso (LoginUseCase)                   Caso de uso (CrearReporteUseCase)
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

## 8. Hexagonal y BFF en pocas palabras

**Hexagonal.** El negocio (dominio y casos de uso) vive en el centro y no sabe nada de bases de datos ni de HTTP.
Para hablar con el exterior define **puertos** (interfaces); afuera, los **adaptadores** los implementan.
Analogía: un enchufe en la pared. La casa define la forma del enchufe (puerto) y cualquier aparato compatible (adaptador) se conecta.
Así cambiamos el repositorio en memoria por PostgreSQL sin tocar el negocio.

**BFF (Backend For Frontend).** Cada cliente tiene su propia puerta HTTP adaptada a lo que necesita.
El BFF solo recibe la petición, la valida, llama al caso de uso y da forma a la respuesta.
Analogía: un mesero por tipo de cliente. La cocina (el negocio) es la misma; cada mesero sirve el plato como lo pide su mesa.
Por eso el dashboard responde en `snake_case` y el móvil en `camelCase`, sin afectarse entre ellos.

## 9. Reglas de dependencia

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

## 10. Recorrido del login

1. `src/dashboard/bff/controllers/auth.controller.ts` recibe `POST /api/dashboard/v1/auth/login` y valida el cuerpo con `src/dashboard/bff/dto/login.request.ts`.
2. Llama a `LoginUseCase` a través de `src/dashboard/modules/auth/index.ts` (la única puerta del módulo).
3. `src/dashboard/modules/auth/application/login.use-case.ts` busca el usuario y compara la contraseña con la entidad `Usuario` (`domain/usuario.ts`).
4. Para buscar el usuario usa el puerto `UsuarioRepositoryPort` (`application/usuario.repository.port.ts`).
5. `auth.module.ts` conecta ese puerto con `InMemoryUsuarioRepository` (`infrastructure/in-memory-usuario.repository.ts`).
6. Si algo falla, el caso de uso lanza `CredencialesInvalidasError`; el controlador la convierte en `401`. Si sale bien, responde en `snake_case`.

## 11. Cómo agregar una funcionalidad nueva

1. **Dominio**: crea la entidad y sus errores en `modules/<modulo>/domain/` (TypeScript puro).
2. **Aplicación**: crea el caso de uso (`<accion>.use-case.ts`, con `execute()`) y su puerto con token `Symbol` en `application/`.
3. **Infraestructura**: implementa el puerto en `infrastructure/` (en memoria al principio).
4. **Módulo**: en `<modulo>.module.ts` conecta `{ provide: PUERTO, useClass: Adaptador }` y exporta el caso de uso desde `index.ts`.
5. **BFF**: agrega el DTO y el controlador en `<producto>/bff/`, regístralo en `<producto>-bff.module.ts` y corre `npm run lint && npm run build && npm run test`.

## 12. Hoja de ruta

| Pendiente | Dónde va |
|---|---|
| JWT del dashboard y roles (`admin` / `lector`) que reemplacen `token-de-prueba` (el JWT de la app móvil ya está en `src/platform/auth/`) | `src/platform/auth/` + `src/dashboard/modules/auth/` |
| Multi-tenant (una base de datos por entidad) | `src/platform/tenancy/` |
| MongoDB y PostgreSQL para el resto de módulos (el tablero ya usa PostgreSQL) | `src/platform/database/` + `infrastructure/` de cada módulo |
| Eventos con RabbitMQ (por ejemplo, reportes del móvil hacia el dashboard) | `src/platform/messaging/` |
| Caché con Redis | `src/platform/cache/` |
| Contraseña en `dashboard.usuarios`, login real con JWT y hacer cumplir los roles (`admin` / `lector`) |
| Que la entidad cambie desde el dashboard el estado de un reporte (por ejemplo, descartarlo como falso positivo con su motivo) o atienda una activación | `src/dashboard/modules/` + `compartido.reportes` y `compartido.activaciones_panico` | `src/platform/auth/` + `src/dashboard/modules/auth/` y `users/` |
| Botón *Exportar* del tablero | `src/dashboard/modules/kpis/` |
| Calcular el `riesgo` de cada ciclovía (por ejemplo, con los siniestros cercanos) | `src/common/modules/ciclovias/` + columna `riesgo` de `ciclovias` |
| Activar `mongo`, `redis` y `rabbitmq` | Descomentarlos en `docker-compose.yml` cuando exista su adaptador |
| Compose de otros entornos y Nginx | `infra/docker/` y `infra/nginx/` |

## 13. Glosario

- **Entidad**: objeto del negocio con sus reglas (por ejemplo, `Usuario`).
- **Caso de uso**: una acción del negocio, con un método `execute()` (por ejemplo, `LoginUseCase`).
- **Puerto**: interfaz que el negocio necesita para hablar con el exterior (por ejemplo, `UsuarioRepositoryPort`).
- **Adaptador**: implementación concreta de un puerto (por ejemplo, `InMemoryUsuarioRepository`).
- **DTO**: forma de los datos que entran o salen por HTTP (por ejemplo, `LoginRequest`).
- **BFF**: la puerta HTTP propia de cada producto.

## 14. Más detalle

El mapa completo de carpetas y archivos está en [`estructura.md`](estructura.md).
