# platform/auth — JWT, guards y roles para proteger los BFF.
Hoy emite y valida el JWT (HS256, 7 dias) de los ciudadanos de la app movil, con `JwtAuthGuard` y `@UsuarioActual()`. El secreto sale de la variable `JWT_SECRET`.
Pendiente: el dashboard sigue con su token fijo de demostracion y los roles admin/lector aun no se hacen cumplir.
