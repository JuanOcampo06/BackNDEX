# Estructura del proyecto

Generado a partir de `find` sobre el repositorio (sin `node_modules/`, `dist/` ni `.git/`).
Leyenda: `[IMPLEMENTADO]` tiene código de la demo · `[VACÍO - FUTURO]` existe pero está pendiente · `[CONFIG]` configuración.
Toda carpeta vacía lleva un `.gitkeep` para que Git la conserve.

```
.
├── CLAUDE.md                          [CONFIG]          Reglas de arquitectura del proyecto.
├── README.md                          [CONFIG]          Qué es, primeros pasos, teoría y hoja de ruta.
├── estructura.md                      [CONFIG]          Este mapa.
├── LICENSE                            [CONFIG]          Licencia MIT.
├── package.json                       [CONFIG]          Dependencias y scripts (start:dev, build, lint, test).
├── package-lock.json                  [CONFIG]          Versiones exactas instaladas.
├── tsconfig.json                      [CONFIG]          TypeScript strict para src/ y test/.
├── tsconfig.build.json                [CONFIG]          Compilación de src/ a dist/ (sin pruebas).
├── nest-cli.json                      [CONFIG]          Configuración del CLI de NestJS.
├── eslint.config.mjs                  [CONFIG]          Lint + eslint-plugin-boundaries con las reglas de dependencia.
├── Dockerfile                         [CONFIG]          Imagen única multietapa, USER node y HEALTHCHECK.
├── docker-compose.yml                 [CONFIG]          Servicios api, postgres (con el anuario 2025) y adminer (puerto 8081); mongo, redis y rabbitmq comentados.
├── .dockerignore                      [CONFIG]          Lo que no entra a la imagen (node_modules, dist, .env...).
├── .env.example                       [CONFIG]          Plantilla de variables (puertos, PostgreSQL, DATABASE_URL, CORS_ORIGIN); se copia a .env.
├── .env                               [CONFIG]          Tu configuración local; no se versiona.
├── .gitignore                         [CONFIG]          Lo que Git ignora.
├── demo.http                          [CONFIG]          Peticiones de prueba: health, login y todos los endpoints del tablero.
├── infra/                             [IMPLEMENTADO]    Despliegue adicional.
│   ├── postgres/                      [IMPLEMENTADO]    Scripts que PostgreSQL ejecuta al crear la base por primera vez.
│   │   ├── 01-esquema.sql             [IMPLEMENTADO]    Esquemas compartido, dashboard y movil con sus tablas, restricciones e índices.
│   │   ├── 02-datos.sql               [IMPLEMENTADO]    Localidades, anuario de siniestralidad 2025 (lugares, siniestros y actores viales) y usuarios del dashboard; lo demás queda vacío.
│   │   ├── 03-ciclovias.sql           [IMPLEMENTADO]    Crea compartido.ciclovias_fuente y compartido.ciclovias y carga el JSON; se puede volver a correr.
│   │   └── datos/
│   │       ├── anuario-siniestros.csv [IMPLEMENTADO]    Hoja Siniestros del anuario 2025 (11.573 filas, solo las columnas que usa la base).
│   │       ├── anuario-actores-viales.csv [IMPLEMENTADO] Hoja Actor vial del anuario 2025 (28.029 filas).
│   │       └── ciclovias-osm.json     [IMPLEMENTADO]    Export de OpenStreetMap (Overpass) con las 2.448 vías de ciclovía.
│   ├── docker/                        [VACÍO - FUTURO]  Compose de QA y producción (+ README.md de 2 líneas).
│   └── nginx/                         [VACÍO - FUTURO]  Proxy inverso (+ README.md de 2 líneas).
├── test/                              [IMPLEMENTADO]    Pruebas e2e.
│   ├── auth.e2e-spec.ts               [IMPLEMENTADO]    Llama al login real y comprueba 200 y 401.
│   ├── mobile.e2e-spec.ts             [IMPLEMENTADO]    Reportes del móvil por HTTP con un repositorio falso y token (201, 400, 401, 404).
│   ├── auth-viajes-movil.e2e-spec.ts  [IMPLEMENTADO]    Registro, login y viajes del móvil por HTTP con repositorios falsos (201, 400, 401, 404, 409).
│   ├── rutas-movil.e2e-spec.ts        [IMPLEMENTADO]    Ruta rápida y segura del móvil por HTTP con una red de ciclovías falsa (200, 400, 401).
│   ├── exportar-kpis.e2e-spec.ts      [IMPLEMENTADO]    Descarga el Excel por HTTP, lo abre y comprueba sus hojas y los 400.
│   └── filtros-multiples.e2e-spec.ts  [IMPLEMENTADO]    Comprueba que los filtros con varios valores llegan como lista y que un valor inválido da 400.
└── src/
    ├── main.ts                        [IMPLEMENTADO]    Arranque: lee .env, prefijo /api, CORS, Swagger y puerto.
    ├── swagger/
    │   └── configurar-swagger.ts      [IMPLEMENTADO]    Página de Swagger con todos los endpoints en /api/docs (JSON en /api/docs-json).
    ├── app.module.ts                  [IMPLEMENTADO]    Une los dos BFF y expone GET /api/health.
    ├── shared/                        [IMPLEMENTADO]    Código común en TypeScript simple.
    │   ├── domain-error.ts            [IMPLEMENTADO]    Error base del negocio (codigo + mensaje).
    │   ├── coordenadas.ts             [IMPLEMENTADO]    Valida latitud y longitud (lo usan reports y sos).
    │   └── tipos-vehiculo.ts          [IMPLEMENTADO]    Tipos de vehículo que piden reports y sos (los mismos del filtro del dashboard).
    ├── platform/                      [IMPLEMENTADO]    Herramientas técnicas reutilizables (solo database tiene código).
    │   ├── auth/                      [IMPLEMENTADO]    JWT de la app móvil: jwt.ts (firma y verifica HS256 con JWT_SECRET), jwt-auth.guard.ts y usuario-actual.decorator.ts (+ jwt.spec.ts y README.md). Roles pendientes.
    │   ├── tenancy/                   [VACÍO - FUTURO]  Multi-tenant, una BD por entidad (+ README.md).
    │   ├── database/                  [IMPLEMENTADO]    PostgreSQL (MongoDB pendiente) (+ README.md).
    │   │   └── postgres.ts            [IMPLEMENTADO]    Crea la conexión a PostgreSQL con DATABASE_URL.
    │   ├── messaging/                 [VACÍO - FUTURO]  RabbitMQ / eventos (+ README.md).
    │   └── cache/                     [VACÍO - FUTURO]  Redis (+ README.md).
    ├── common/                        [IMPLEMENTADO]    Negocio que leen los dos productos; sin controladores.
    │   └── modules/
    │       └── ciclovias/             [IMPLEMENTADO]    Ciclovías por zona del mapa.
    │           ├── index.ts           [IMPLEMENTADO]    Lo único que los dos BFF pueden importar del módulo.
    │           ├── ciclovias.module.ts [IMPLEMENTADO]   Conecta el puerto con PostgresCicloviaRepository.
    │           ├── domain/
    │           │   ├── ciclovia.ts    [IMPLEMENTADO]    Forma de una ciclovía y sus tipos (ciclovia, cruce).
    │           │   ├── area-mapa.ts   [IMPLEMENTADO]    Rectángulo visible del mapa; valida las esquinas.
    │           │   └── area-mapa.spec.ts [IMPLEMENTADO] Prueba unitaria de AreaMapa.
    │           ├── application/
    │           │   ├── ciclovia.repository.port.ts   [IMPLEMENTADO] Puerto y token CICLOVIA_REPOSITORY.
    │           │   ├── obtener-ciclovias.use-case.ts [IMPLEMENTADO] ObtenerCicloviasUseCase.execute().
    │           │   └── obtener-ciclovias.use-case.spec.ts [IMPLEMENTADO] Prueba con repositorio falso.
    │           └── infrastructure/
    │               └── postgres-ciclovia.repository.ts [IMPLEMENTADO] Consulta por rectángulo en PostgreSQL.
    ├── dashboard/                     [IMPLEMENTADO]    PRODUCTO 1: tablero institucional.
    │   ├── bff/                       [IMPLEMENTADO]    Única puerta HTTP: /api/dashboard/v1 (snake_case).
    │   │   ├── dashboard-bff.module.ts [IMPLEMENTADO]   Registra el prefijo, los módulos y los controladores.
    │   │   ├── snake-case.ts          [IMPLEMENTADO]    Convierte las claves de las respuestas a snake_case.
    │   │   ├── domain-error.filter.ts [IMPLEMENTADO]    Errores del negocio a 404 (_NO_ENCONTRADO), 409 (_DUPLICADO) o 400.
    │   │   ├── controllers/
    │   │   │   ├── auth.controller.ts [IMPLEMENTADO]    POST auth/login: valida, llama al caso de uso, responde.
    │   │   │   ├── tablero.controller.ts [IMPLEMENTADO] GET tablero/...: un endpoint por tarjeta y gráfica.
    │   │   │   ├── exportar-kpis.controller.ts [IMPLEMENTADO] GET tablero/exportar: descarga los KPIs elegidos en un Excel.
    │   │   │   ├── ciclovias.controller.ts [IMPLEMENTADO] GET ciclovias: ciclovías de la zona del mapa (snake_case).
    │   │   │   └── usuarios.controller.ts [IMPLEMENTADO] GET, POST, PATCH y DELETE de usuarios del dashboard.
    │   │   └── dto/
    │   │       ├── login.request.ts   [IMPLEMENTADO]    email válido y password no vacía.
    │   │       ├── tablero.query.ts   [IMPLEMENTADO]    Filtros opcionales: mes_desde, mes_hasta y listas de localidad_id, tipo_vehiculo y fuente (anuario o app).
    │   │       ├── exportar-kpis.query.ts [IMPLEMENTADO] Esos mismos filtros más la lista de KPIs a exportar.
    │   │       ├── ciclovias.query.ts [IMPLEMENTADO]    min_lat, min_lon, max_lat, max_lon y tipo opcional.
    │   │       ├── crear-usuario.request.ts / actualizar-usuario.request.ts [IMPLEMENTADO] Cuerpos de POST y PATCH.
    │   │       ├── listar-usuarios.query.ts [IMPLEMENTADO] rol opcional.
    │   │       └── usuario.response.ts [IMPLEMENTADO]   Forma del usuario (solo para Swagger).
    │   └── modules/                   [IMPLEMENTADO]    Negocio del dashboard, sin controladores.
    │       ├── auth/                  [IMPLEMENTADO]    Login.
    │       │   ├── index.ts           [IMPLEMENTADO]    Lo único que el BFF puede importar del módulo.
    │       │   ├── auth.module.ts     [IMPLEMENTADO]    Conecta el puerto con su adaptador en memoria.
    │       │   ├── domain/
    │       │   │   ├── usuario.ts     [IMPLEMENTADO]    Entidad Usuario; valida sus datos y su contraseña.
    │       │   │   └── credenciales-invalidas.error.ts [IMPLEMENTADO] Error genérico de login.
    │       │   ├── application/
    │       │   │   ├── login.use-case.ts       [IMPLEMENTADO] LoginUseCase.execute().
    │       │   │   ├── login.use-case.spec.ts  [IMPLEMENTADO] Prueba unitaria con repositorio falso.
    │       │   │   └── usuario.repository.port.ts [IMPLEMENTADO] Puerto y token USUARIO_REPOSITORY.
    │       │   └── infrastructure/
    │       │       └── in-memory-usuario.repository.ts [IMPLEMENTADO] Un usuario de prueba en memoria.
    │       ├── users/                 [IMPLEMENTADO]    Usuarios del dashboard con rol admin o lector (tabla dashboard.usuarios).
    │       │   ├── index.ts / users.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
    │       │   ├── domain/            [IMPLEMENTADO]    Usuario, roles, reglas de nombre, correo y rol, y errores.
    │       │   ├── application/       [IMPLEMENTADO]    Listar, obtener, crear, actualizar y eliminar + puerto + pruebas.
    │       │   └── infrastructure/    [IMPLEMENTADO]    postgres-usuarios.repository.ts.
    │       └── kpis/                  [IMPLEMENTADO]    Cifras, gráficas y mapas del tablero.
    │           ├── index.ts           [IMPLEMENTADO]    Exporta el módulo, los casos de uso, Periodo y los catálogos.
    │           ├── kpis.module.ts     [IMPLEMENTADO]    Conecta el puerto con PostgresTableroRepository y arma los casos de uso.
    │           ├── domain/
    │           │   ├── periodo.ts     [IMPLEMENTADO]    Rango de meses, periodo anterior y años de comparación.
    │           │   ├── periodo.spec.ts [IMPLEMENTADO]   Prueba unitaria de Periodo.
    │           │   ├── kpis-exportables.ts [IMPLEMENTADO] Catálogo de KPIs exportables y validación de la selección.
    │           │   ├── kpis-exportables.spec.ts [IMPLEMENTADO] Prueba unitaria de la selección.
    │           │   ├── filtros-tablero.ts [IMPLEMENTADO] Forma de los filtros del tablero y qué gráficas entran según la fuente.
    │           │   ├── filtros-tablero.spec.ts [IMPLEMENTADO] Prueba unitaria de la regla de fuentes.
    │           │   ├── catalogos.ts   [IMPLEMENTADO]    Tipos de vehículo, fuentes (anuario y app), categorías principales de reporte e indicadores.
    │           │   └── calculos.ts    [IMPLEMENTADO]    Porcentajes, variación, franjas horarias y rangos de edad.
    │           ├── application/
    │           │   ├── tablero.repository.port.ts [IMPLEMENTADO] Puerto y token TABLERO_REPOSITORY.
    │           │   ├── obtener-*.use-case.ts      [IMPLEMENTADO] 11 casos de uso, uno por tarjeta o gráfica, y obtener-ultimo-mes-con-datos (mes final cuando no llegan meses).
    │           │   ├── exportar-kpis.use-case.ts  [IMPLEMENTADO] Arma el libro de Excel reutilizando esos casos de uso.
    │           │   ├── hojas-excel-kpis.ts        [IMPLEMENTADO] Cómo se convierte cada KPI en una hoja y la hoja de filtros.
    │           │   ├── generador-excel.port.ts    [IMPLEMENTADO] Puerto GENERADOR_EXCEL y la forma neutra del libro.
    │           │   └── *.use-case.spec.ts         [IMPLEMENTADO] Pruebas unitarias con repositorio falso.
    │           └── infrastructure/
    │               ├── postgres-tablero.repository.ts [IMPLEMENTADO] Consultas SQL a PostgreSQL.
    │               ├── exceljs-generador-excel.ts [IMPLEMENTADO] Escribe el archivo xlsx con la librería exceljs.
    │               └── exceljs-generador-excel.spec.ts [IMPLEMENTADO] Genera el archivo y lo vuelve a abrir para comprobarlo.
    └── mobile/                        [IMPLEMENTADO]    PRODUCTO 2: app ciudadana (registro y login, reportes, rutas, SOS, viajes y ciclovías).
        ├── bff/                       [IMPLEMENTADO]    Única puerta HTTP: /api/mobile/v1 (camelCase).
        │   ├── mobile-bff.module.ts   [IMPLEMENTADO]    Registra el prefijo, los módulos y los controladores.
        │   ├── domain-error.filter.ts [IMPLEMENTADO]    Convierte los DomainError en 401 (CREDENCIALES_INVALIDAS), 404 (_NO_ENCONTRADO), 409 (_DUPLICADO) o 400.
        │   ├── controllers/
        │   │   ├── auth.controller.ts      [IMPLEMENTADO] POST auth/register y auth/login: entregan el JWT.
        │   │   ├── ciclovias.controller.ts [IMPLEMENTADO] GET ciclovias: ciclovías de la zona del mapa.
        │   │   ├── reports.controller.ts   [IMPLEMENTADO] POST, GET y GET :id de reports (piden token).
        │   │   ├── routes.controller.ts    [IMPLEMENTADO] GET routes: ruta segura, equilibrada y rápida entre dos puntos (pide token).
        │   │   ├── sos.controller.ts       [IMPLEMENTADO] POST, GET y PATCH :id/cancelar de sos (piden token).
        │   │   └── trips.controller.ts     [IMPLEMENTADO] POST, GET, GET :id, POST :id/puntos y PATCH :id/finalizar de trips (piden token).
        │   └── dto/
        │       ├── ciclovias.query.ts      [IMPLEMENTADO] minLat, minLon, maxLat, maxLon y tipo opcional.
        │       ├── crear-reporte.request.ts [IMPLEMENTADO] Cuerpo del POST /reports.
        │       ├── calcular-rutas.query.ts [IMPLEMENTADO] origenLat, origenLon, destinoLat y destinoLon de GET routes.
        │       ├── rutas.response.ts       [IMPLEMENTADO] Forma de la ruta, sus pasos y la respuesta (solo para Swagger).
        │       ├── registro.request.ts / iniciar-sesion.request.ts [IMPLEMENTADO] Cuerpos de POST auth/register y auth/login.
        │       ├── sesion.response.ts      [IMPLEMENTADO] Forma de la sesión y del ciudadano (solo para Swagger).
        │       ├── ubicacion.request.ts    [IMPLEMENTADO] latitud y longitud de POST trips y POST trips/:id/puntos.
        │       ├── viaje.response.ts       [IMPLEMENTADO] Forma del viaje, del punto y del detalle (solo para Swagger).
        │       ├── listar-reportes.query.ts [IMPLEMENTADO] categoria y subcategoria opcionales.
        │       ├── activar-sos.request.ts  [IMPLEMENTADO] Cuerpo del POST /sos (latitud y longitud).
        │       ├── reporte.response.ts     [IMPLEMENTADO] Forma del reporte (solo para Swagger).
        │       ├── activacion-sos.response.ts [IMPLEMENTADO] Forma de la activación (solo para Swagger).
        │       └── listar-sos.query.ts     [IMPLEMENTADO] estado opcional.
        └── modules/
            ├── auth/                  [IMPLEMENTADO]    Registro e inicio de sesión del ciudadano (tabla movil.usuarios) con contraseña cifrada con scrypt.
            │   ├── index.ts / auth.module.ts [IMPLEMENTADO] Puerta del módulo y conexión de los tres puertos con sus adaptadores.
            │   ├── domain/            [IMPLEMENTADO]    Ciudadano, géneros, reglas de nombre, correo, teléfono, contraseña y fecha de nacimiento (mayor de 18 años), y errores.
            │   ├── application/       [IMPLEMENTADO]    Registrar e iniciar sesión + puertos (repositorio, cifrador, emisor de token) + pruebas.
            │   └── infrastructure/    [IMPLEMENTADO]    postgres-ciudadanos.repository.ts, scrypt-contrasena.cifrador.ts y jwt-token.emisor.ts.
            ├── routes/                [IMPLEMENTADO]    Ruta segura, equilibrada y rápida sobre la red de ciclovías de compartido.ciclovias (solo lectura).
            │   ├── index.ts / routes.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
            │   ├── domain/            [IMPLEMENTADO]    Red vial y su construcción, costos de la rápida, la equilibrada y la segura, camino mínimo (Dijkstra), maniobras de giro, ruta y errores + pruebas.
            │   ├── application/       [IMPLEMENTADO]    CalcularRutasUseCase + puerto de lectura de las ciclovías + pruebas.
            │   └── infrastructure/    [IMPLEMENTADO]    postgres-red-ciclovias.repository.ts (lee todas las vías y las guarda 10 minutos en memoria).
            ├── reports/               [IMPLEMENTADO]    Reportes ciudadanos: escribe en la tabla maestra compartido.reportes (autores en movil.usuarios).
            │   ├── index.ts / reports.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
            │   ├── domain/            [IMPLEMENTADO]    Reporte, categorías principales con sus subcategorías, estados y errores.
            │   ├── application/       [IMPLEMENTADO]    Crear, listar y obtener reporte + puerto + prueba.
            │   └── infrastructure/    [IMPLEMENTADO]    postgres-reportes.repository.ts.
            └── sos/                   [IMPLEMENTADO]    Botón de pánico: escribe en la tabla maestra compartido.activaciones_panico.
                ├── index.ts / sos.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
                ├── domain/            [IMPLEMENTADO]    Activación, estados, regla de cancelación y errores.
                ├── application/       [IMPLEMENTADO]    Activar, listar y cancelar + puerto + prueba.
                └── infrastructure/    [IMPLEMENTADO]    postgres-sos.repository.ts.
            └── trips/                 [IMPLEMENTADO]    Viajes en bicicleta con su recorrido GPS (tablas movil.viajes y movil.puntos_viaje).
                ├── index.ts / trips.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
                ├── domain/            [IMPLEMENTADO]    Viaje, puntos, estados, distancia (haversine), reglas y errores + prueba.
                ├── application/       [IMPLEMENTADO]    Iniciar, registrar punto, finalizar, listar y obtener + puerto + pruebas.
                └── infrastructure/    [IMPLEMENTADO]    postgres-viajes.repository.ts.
```

## Qué hay que tocar para…

| Caso | Archivos y carpetas |
|---|---|
| Agregar un endpoint al dashboard | Caso de uso en `src/dashboard/modules/<modulo>/application/` (y dominio si hace falta) → exportarlo en su `index.ts` y registrarlo en `<modulo>.module.ts` → DTO en `src/dashboard/bff/dto/` → controlador en `src/dashboard/bff/controllers/` → agregarlo a `dashboard-bff.module.ts`. |
| Conectar otro módulo a PostgreSQL | Usar `crearPoolPostgres()` de `src/platform/database/postgres.ts` en un adaptador nuevo de `infrastructure/` → cambiar `useClass` en `<modulo>.module.ts` → tablas nuevas en `infra/postgres/01-esquema.sql`. |
| Compartir otro dato de consulta entre dashboard y móvil | Módulo nuevo en `src/common/modules/<modulo>/` (mismas capas) → exportar desde su `index.ts` → un controlador en cada BFF (`dashboard/bff/` en snake_case y `mobile/bff/` en camelCase) → importar el módulo en los dos `*-bff.module.ts`. |
| Agregar un KPI a la exportación de Excel | Nombre en `domain/kpis-exportables.ts` → su hoja en `application/hojas-excel-kpis.ts` (reutiliza el caso de uso del KPI) → agregarlo al `Record` de ese archivo y, si es un caso de uso nuevo, a `CasosDeUsoKpi` y a la fábrica de `kpis.module.ts`. |
| Cambiar una gráfica del tablero | Caso de uso en `src/dashboard/modules/kpis/application/` → consulta en `infrastructure/postgres-tablero.repository.ts` (y en el puerto si cambia la forma) → ruta en `src/dashboard/bff/controllers/tablero.controller.ts`. |
| Activar JWT en el dashboard | El JWT ya existe en `src/platform/auth/` (lo usa la app móvil) → sustituir `TOKEN_DE_PRUEBA` en `login.use-case.ts` por un puerto de tokens como el de `mobile/modules/auth/` → proteger los controladores de `src/dashboard/bff/controllers/` con `JwtAuthGuard`. |
| Proteger otro endpoint de la app móvil | `@UseGuards(JwtAuthGuard)` y `@ApiBearerAuth()` en su controlador → recibir al ciudadano con `@UsuarioActual() usuarioId: number` (nunca desde el cuerpo). |
| Que un endpoint nuevo salga en Swagger | En su controlador: `@ApiTags` con uno de los grupos de `src/swagger/configurar-swagger.ts`, `@ApiOperation` y las respuestas (`@ApiOkResponse`...); en sus DTO: `@ApiProperty` o `@ApiPropertyOptional` en cada campo. |
| Agregar un endpoint a la app móvil | Caso de uso en `src/mobile/modules/<modulo>/application/` → exportarlo en su `index.ts` → DTO y controlador en `src/mobile/bff/` (camelCase) → registrarlo en `mobile-bff.module.ts`; sus tablas van en el esquema `movil` si solo las usa la app, o en `compartido` si también las lee el dashboard. |
