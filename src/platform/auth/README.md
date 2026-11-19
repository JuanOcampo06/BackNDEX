# platform/auth — JWT, guards y roles para proteger los BFF.
Emite y valida el JWT (HS256, 7 dias) con el secreto de la variable `JWT_SECRET`.
- App movil: `JwtAuthGuard` y `@UsuarioActual()` con el token del ciudadano.
- Dashboard: `DashboardAuthGuard` exige un token del dashboard (`aud: dashboard`) y `@SoloRoles('admin')` deja un endpoint solo al Administrador (401 sin token valido y 403 con otro rol).
  El estado se lee de la base en cada peticion (`CONSULTA_ACCESO_DASHBOARD`, que conecta el BFF del dashboard): un usuario eliminado responde 401 y un rol quitado aplica de inmediato.
  Si `debeCambiarContrasena` es true responde 403 `CAMBIO_CONTRASENA_REQUERIDO`, salvo en los endpoints marcados con `@PermitidoSinCambiarContrasena()`.
- Limite de intentos: `@LimiteLogin()` (5 por minuto por IP, en los login y en los endpoints que envian o revisan codigos del correo) y `@LimiteRegistro()` (3 por hora por IP) responden 429 `DEMASIADOS_INTENTOS`.
