// Unica puerta de platform/auth con el JWT las contrasenas y los guards que protegen la app movil y el dashboard
export { AUDIENCIA_DASHBOARD, firmarToken, validarSecretoJwt, verificarToken } from './jwt';
export type { DatosExtraToken, PayloadToken } from './jwt';
export { cifrarContrasena, contrasenaCoincide, crearTokenAleatorio, hashDeToken } from './contrasenas';
export { JwtAuthGuard } from './jwt-auth.guard';
export { DashboardAuthGuard, PermitidoSinCambiarContrasena, SoloRoles } from './dashboard-auth.guard';
export { CONSULTA_ACCESO_DASHBOARD } from './consulta-acceso-dashboard';
export type { ConsultaAccesoDashboard, EstadoAccesoDashboard } from './consulta-acceso-dashboard';
export { UsuarioActual } from './usuario-actual.decorator';
export { LimiteIntentosGuard, LimiteLogin, LimiteRegistro } from './limite-intentos';
