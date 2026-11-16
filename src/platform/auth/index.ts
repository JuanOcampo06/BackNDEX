// Unica puerta de platform/auth con el JWT las contrasenas y los guards que protegen la app movil y el dashboard
export { AUDIENCIA_DASHBOARD, firmarToken, validarSecretoJwt, verificarToken } from './jwt';
export type { DatosExtraToken, PayloadToken } from './jwt';
export { cifrarContrasena, contrasenaCoincide, crearTokenAleatorio, hashDeToken } from './contrasenas';
export { JwtAuthGuard } from './jwt-auth.guard';
export { DashboardAuthGuard, SoloRoles } from './dashboard-auth.guard';
export { UsuarioActual } from './usuario-actual.decorator';
