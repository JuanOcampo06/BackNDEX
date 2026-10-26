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
├── docker-compose.yml                 [CONFIG]          Servicios api, postgres (con datos de prueba) y adminer (puerto 8081); mongo, redis y rabbitmq comentados.
├── .dockerignore                      [CONFIG]          Lo que no entra a la imagen (node_modules, dist, .env...).
├── .env.example                       [CONFIG]          Plantilla de variables (puertos, PostgreSQL, DATABASE_URL, CORS_ORIGIN); se copia a .env.
├── .env                               [CONFIG]          Tu configuración local; no se versiona.
├── .gitignore                         [CONFIG]          Lo que Git ignora.
├── demo.http                          [CONFIG]          Peticiones de prueba: health, login y todos los endpoints del tablero.
├── infra/                             [IMPLEMENTADO]    Despliegue adicional.
│   ├── postgres/                      [IMPLEMENTADO]    Scripts que PostgreSQL ejecuta al crear la base por primera vez.
│   │   ├── 01-esquema.sql             [IMPLEMENTADO]    Tablas del tablero (localidades, lugares, siniestros, conteos_usuarios, reportes, activaciones_panico).
│   │   ├── 02-datos.sql               [IMPLEMENTADO]    Datos de prueba desde enero del año pasado hasta hoy.
│   │   ├── 03-ciclovias.sql           [IMPLEMENTADO]    Crea ciclovias_fuente y ciclovias y carga el JSON; se puede volver a correr.
│   │   ├── 04-movil-esquema.sql       [IMPLEMENTADO]    Schema movil con usuarios, reportes y activaciones_sos de la app.
│   │   ├── 05-movil-datos.sql         [IMPLEMENTADO]    Datos de prueba de la app (3 ciudadanos, 5 reportes, 3 SOS).
│   │   └── datos/
│   │       └── ciclovias-osm.json     [IMPLEMENTADO]    Export de OpenStreetMap (Overpass) con las 2.448 vías de ciclovía.
│   ├── docker/                        [VACÍO - FUTURO]  Compose de QA y producción (+ README.md de 2 líneas).
│   └── nginx/                         [VACÍO - FUTURO]  Proxy inverso (+ README.md de 2 líneas).
├── test/                              [IMPLEMENTADO]    Pruebas e2e.
│   ├── auth.e2e-spec.ts               [IMPLEMENTADO]    Llama al login real y comprueba 200 y 401.
│   └── mobile.e2e-spec.ts             [IMPLEMENTADO]    Reportes del móvil por HTTP con un repositorio falso (201, 400, 404).
└── src/
    ├── main.ts                        [IMPLEMENTADO]    Arranque: lee .env, prefijo /api, CORS y puerto.
    ├── app.module.ts                  [IMPLEMENTADO]    Une los dos BFF y expone GET /api/health.
    ├── shared/                        [IMPLEMENTADO]    Código común en TypeScript simple.
    │   ├── domain-error.ts            [IMPLEMENTADO]    Error base del negocio (codigo + mensaje).
    │   └── coordenadas.ts             [IMPLEMENTADO]    Valida latitud y longitud (lo usan reports y sos).
    ├── platform/                      [IMPLEMENTADO]    Herramientas técnicas reutilizables (solo database tiene código).
    │   ├── auth/                      [VACÍO - FUTURO]  JWT, guards y roles (+ README.md).
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
    │   │   ├── controllers/
    │   │   │   ├── auth.controller.ts [IMPLEMENTADO]    POST auth/login: valida, llama al caso de uso, responde.
    │   │   │   ├── tablero.controller.ts [IMPLEMENTADO] GET tablero/...: un endpoint por tarjeta y gráfica.
    │   │   │   └── ciclovias.controller.ts [IMPLEMENTADO] GET ciclovias: ciclovías de la zona del mapa (snake_case).
    │   │   └── dto/
    │   │       ├── login.request.ts   [IMPLEMENTADO]    email válido y password no vacía.
    │   │       ├── tablero.query.ts   [IMPLEMENTADO]    Filtros opcionales: mes_desde, mes_hasta, localidad_id, tipo_vehiculo, fuente.
    │   │       └── ciclovias.query.ts [IMPLEMENTADO]    min_lat, min_lon, max_lat, max_lon y tipo opcional.
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
    │       ├── users/                 [VACÍO - FUTURO]  Gestión de usuarios.
    │       │   ├── domain/ application/ infrastructure/ [VACÍO - FUTURO] Solo .gitkeep.
    │       │   ├── users.module.ts    [VACÍO - FUTURO]  Módulo Nest sin providers.
    │       │   └── index.ts           [VACÍO - FUTURO]  Exporta solo UsersModule.
    │       └── kpis/                  [IMPLEMENTADO]    Cifras, gráficas y mapas del tablero.
    │           ├── index.ts           [IMPLEMENTADO]    Exporta el módulo, los casos de uso, Periodo y los catálogos.
    │           ├── kpis.module.ts     [IMPLEMENTADO]    Conecta el puerto con PostgresTableroRepository y arma los casos de uso.
    │           ├── domain/
    │           │   ├── periodo.ts     [IMPLEMENTADO]    Rango de meses, periodo anterior y años de comparación.
    │           │   ├── periodo.spec.ts [IMPLEMENTADO]   Prueba unitaria de Periodo.
    │           │   ├── filtros-tablero.ts [IMPLEMENTADO] Forma de los filtros del tablero.
    │           │   ├── catalogos.ts   [IMPLEMENTADO]    Tipos de vehículo, fuentes e indicadores.
    │           │   └── calculos.ts    [IMPLEMENTADO]    Porcentajes, variación, franjas horarias y rangos de edad.
    │           ├── application/
    │           │   ├── tablero.repository.port.ts [IMPLEMENTADO] Puerto y token TABLERO_REPOSITORY.
    │           │   ├── obtener-*.use-case.ts      [IMPLEMENTADO] 11 casos de uso, uno por tarjeta o gráfica.
    │           │   └── *.use-case.spec.ts         [IMPLEMENTADO] Pruebas unitarias con repositorio falso.
    │           └── infrastructure/
    │               └── postgres-tablero.repository.ts [IMPLEMENTADO] Consultas SQL a PostgreSQL.
    └── mobile/                        [IMPLEMENTADO]    PRODUCTO 2: app ciudadana (reportes, SOS y ciclovías).
        ├── bff/                       [IMPLEMENTADO]    Única puerta HTTP: /api/mobile/v1 (camelCase).
        │   ├── mobile-bff.module.ts   [IMPLEMENTADO]    Registra el prefijo, los módulos y los controladores.
        │   ├── domain-error.filter.ts [IMPLEMENTADO]    Convierte los DomainError en 404 (_NO_ENCONTRADO) o 400.
        │   ├── controllers/
        │   │   ├── ciclovias.controller.ts [IMPLEMENTADO] GET ciclovias: ciclovías de la zona del mapa.
        │   │   ├── reports.controller.ts   [IMPLEMENTADO] POST, GET y GET :id de reports.
        │   │   └── sos.controller.ts       [IMPLEMENTADO] POST, GET y PATCH :id/cancelar de sos.
        │   └── dto/
        │       ├── ciclovias.query.ts      [IMPLEMENTADO] minLat, minLon, maxLat, maxLon y tipo opcional.
        │       ├── crear-reporte.request.ts [IMPLEMENTADO] Cuerpo del POST /reports.
        │       ├── listar-reportes.query.ts [IMPLEMENTADO] usuarioId y categoria opcionales.
        │       ├── activar-sos.request.ts  [IMPLEMENTADO] Cuerpo del POST /sos.
        │       └── listar-sos.query.ts     [IMPLEMENTADO] usuarioId y estado opcionales.
        └── modules/
            ├── reports/               [IMPLEMENTADO]    Reportes ciudadanos (tablas movil.usuarios y movil.reportes).
            │   ├── index.ts / reports.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
            │   ├── domain/            [IMPLEMENTADO]    Reporte, categorías, estados y errores.
            │   ├── application/       [IMPLEMENTADO]    Crear, listar y obtener reporte + puerto + prueba.
            │   └── infrastructure/    [IMPLEMENTADO]    postgres-reportes.repository.ts.
            └── sos/                   [IMPLEMENTADO]    Botón de pánico (tabla movil.activaciones_sos).
                ├── index.ts / sos.module.ts [IMPLEMENTADO] Puerta del módulo y conexión puerto-adaptador.
                ├── domain/            [IMPLEMENTADO]    Activación, estados, regla de cancelación y errores.
                ├── application/       [IMPLEMENTADO]    Activar, listar y cancelar + puerto + prueba.
                └── infrastructure/    [IMPLEMENTADO]    postgres-sos.repository.ts.
```

## Qué hay que tocar para…

| Caso | Archivos y carpetas |
|---|---|
| Agregar un endpoint al dashboard | Caso de uso en `src/dashboard/modules/<modulo>/application/` (y dominio si hace falta) → exportarlo en su `index.ts` y registrarlo en `<modulo>.module.ts` → DTO en `src/dashboard/bff/dto/` → controlador en `src/dashboard/bff/controllers/` → agregarlo a `dashboard-bff.module.ts`. |
| Conectar otro módulo a PostgreSQL | Usar `crearPoolPostgres()` de `src/platform/database/postgres.ts` en un adaptador nuevo de `infrastructure/` → cambiar `useClass` en `<modulo>.module.ts` → tablas nuevas en `infra/postgres/01-esquema.sql`. |
| Compartir otro dato de consulta entre dashboard y móvil | Módulo nuevo en `src/common/modules/<modulo>/` (mismas capas) → exportar desde su `index.ts` → un controlador en cada BFF (`dashboard/bff/` en snake_case y `mobile/bff/` en camelCase) → importar el módulo en los dos `*-bff.module.ts`. |
| Cambiar una gráfica del tablero | Caso de uso en `src/dashboard/modules/kpis/application/` → consulta en `infrastructure/postgres-tablero.repository.ts` (y en el puerto si cambia la forma) → ruta en `src/dashboard/bff/controllers/tablero.controller.ts`. |
| Activar JWT | Emisión y guards en `src/platform/auth/` → sustituir `TOKEN_DE_PRUEBA` en `login.use-case.ts` por un puerto de tokens → proteger los controladores de `src/dashboard/bff/controllers/` → secreto en `.env.example`. |
| Agregar un endpoint a la app móvil | Caso de uso en `src/mobile/modules/<modulo>/application/` → exportarlo en su `index.ts` → DTO y controlador en `src/mobile/bff/` (camelCase) → registrarlo en `mobile-bff.module.ts`; sus tablas van en el schema `movil`. |
