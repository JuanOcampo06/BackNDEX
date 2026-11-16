# platform/auth — JWT, guards y roles para proteger los BFF.
Emite y valida el JWT (HS256, 7 dias) con el secreto de la variable `JWT_SECRET`.
- App movil: `JwtAuthGuard` y `@UsuarioActual()` con el token del ciudadano.
- Dashboard: `DashboardAuthGuard` exige un token del dashboard (`aud: dashboard` y `rol`) y `@SoloRoles('admin')` deja un endpoint solo al Administrador (401 sin token valido y 403 con otro rol).
