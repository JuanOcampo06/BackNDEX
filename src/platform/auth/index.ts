// Unica puerta de platform/auth con el JWT y guards para proteger las rutas de la app movil y del dashboard
export { AUDIENCIA_DASHBOARD, firmarToken, verificarToken } from './jwt';
export type { DatosExtraToken, PayloadToken } from './jwt';
export { JwtAuthGuard } from './jwt-auth.guard';
export { DashboardAuthGuard, SoloRoles } from './dashboard-auth.guard';
export { UsuarioActual } from './usuario-actual.decorator';
