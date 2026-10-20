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
│   │   ├── 01-esquema.sql             [IMPLEMENTADO]    Tablas del tablero (localidades, lugares, siniestros, ciclorutas, conteos_usuarios, reportes, activaciones_panico).
│   │   └── 02-datos.sql               [IMPLEMENTADO]    Datos de prueba desde enero del año pasado hasta hoy.
│   ├── docker/                        [VACÍO - FUTURO]  Compose de QA y producción (+ README.md de 2 líneas).
│   └── nginx/                         [VACÍO - FUTURO]  Proxy inverso (+ README.md de 2 líneas).
├── test/                              [IMPLEMENTADO]    Pruebas e2e.
│   └── auth.e2e-spec.ts               [IMPLEMENTADO]    Llama al login real y comprueba 200 y 401.
└── src/
    ├── main.ts                        [IMPLEMENTADO]    Arranque: lee .env, prefijo /api, CORS y puerto.
    ├── app.module.ts                  [IMPLEMENTADO]    Une los dos BFF y expone GET /api/health.
    ├── shared/                        [IMPLEMENTADO]    Código común en TypeScript simple.
    │   └── domain-error.ts            [IMPLEMENTADO]    Error base del negocio (codigo + mensaje).
    ├── platform/                      [IMPLEMENTADO]    Herramientas técnicas reutilizables (solo database tiene código).
    │   ├── auth/                      [VACÍO - FUTURO]  JWT, guards y roles (+ README.md).
    │   ├── tenancy/                   [VACÍO - FUTURO]  Multi-tenant, una BD por entidad (+ README.md).
    │   ├── database/                  [IMPLEMENTADO]    PostgreSQL (MongoDB pendiente) (+ README.md).
    │   │   └── postgres.ts            [IMPLEMENTADO]    Crea la conexión a PostgreSQL con DATABASE_URL.
    │   ├── messaging/                 [VACÍO - FUTURO]  RabbitMQ / eventos (+ README.md).
    │   └── cache/                     [VACÍO - FUTURO]  Redis (+ README.md).
    ├── dashboard/                     [IMPLEMENTADO]    PRODUCTO 1: tablero institucional.
    │   ├── bff/                       [IMPLEMENTADO]    Única puerta HTTP: /api/dashboard/v1 (snake_case).
    │   │   ├── dashboard-bff.module.ts [IMPLEMENTADO]   Registra el prefijo, los módulos y los controladores.
    │   │   ├── snake-case.ts          [IMPLEMENTADO]    Convierte las claves de las respuestas a snake_case.
    │   │   ├── controllers/
    │   │   │   ├── auth.controller.ts [IMPLEMENTADO]    POST auth/login: valida, llama al caso de uso, responde.
    │   │   │   └── tablero.controller.ts [IMPLEMENTADO] GET tablero/...: un endpoint por tarjeta y gráfica.
    │   │   └── dto/
    │   │       ├── login.request.ts   [IMPLEMENTADO]    email válido y password no vacía.
    │   │       └── tablero.query.ts   [IMPLEMENTADO]    Filtros opcionales: mes_desde, mes_hasta, localidad_id, tipo_vehiculo, fuente.
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
    └── mobile/                        [VACÍO - FUTURO]  PRODUCTO 2: app ciudadana.
        ├── bff/                       [VACÍO - FUTURO]  Única puerta HTTP: /api/mobile/v1 (camelCase).
        │   ├── mobile-bff.module.ts   [VACÍO - FUTURO]  Registra el prefijo y los módulos; sin controladores.
        │   ├── controllers/           [VACÍO - FUTURO]  Solo .gitkeep.
        │   └── dto/                   [VACÍO - FUTURO]  Solo .gitkeep.
        └── modules/
            ├── reports/               [VACÍO - FUTURO]  Reportes ciudadanos.
            │   ├── domain/ application/ infrastructure/ [VACÍO - FUTURO] Solo .gitkeep.
            │   ├── reports.module.ts  [VACÍO - FUTURO]  Módulo Nest sin providers.
            │   └── index.ts           [VACÍO - FUTURO]  Exporta solo ReportsModule.
            └── sos/                   [VACÍO - FUTURO]  Botón de pánico.
                ├── domain/ application/ infrastructure/ [VACÍO - FUTURO] Solo .gitkeep.
                ├── sos.module.ts      [VACÍO - FUTURO]  Módulo Nest sin providers.
                └── index.ts           [VACÍO - FUTURO]  Exporta solo SosModule.
```

## Qué hay que tocar para…

| Caso | Archivos y carpetas |
|---|---|
| Agregar un endpoint al dashboard | Caso de uso en `src/dashboard/modules/<modulo>/application/` (y dominio si hace falta) → exportarlo en su `index.ts` y registrarlo en `<modulo>.module.ts` → DTO en `src/dashboard/bff/dto/` → controlador en `src/dashboard/bff/controllers/` → agregarlo a `dashboard-bff.module.ts`. |
| Conectar otro módulo a PostgreSQL | Usar `crearPoolPostgres()` de `src/platform/database/postgres.ts` en un adaptador nuevo de `infrastructure/` → cambiar `useClass` en `<modulo>.module.ts` → tablas nuevas en `infra/postgres/01-esquema.sql`. |
| Cambiar una gráfica del tablero | Caso de uso en `src/dashboard/modules/kpis/application/` → consulta en `infrastructure/postgres-tablero.repository.ts` (y en el puerto si cambia la forma) → ruta en `src/dashboard/bff/controllers/tablero.controller.ts`. |
| Activar JWT | Emisión y guards en `src/platform/auth/` → sustituir `TOKEN_DE_PRUEBA` en `login.use-case.ts` por un puerto de tokens → proteger los controladores de `src/dashboard/bff/controllers/` → secreto en `.env.example`. |
| Empezar la app móvil | Dominio, aplicación e infraestructura en `src/mobile/modules/reports/` o `sos/` → exportar desde su `index.ts` → DTO y controlador en `src/mobile/bff/` (camelCase) → registrarlo en `mobile-bff.module.ts`. |
