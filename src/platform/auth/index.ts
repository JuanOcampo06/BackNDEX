// Unica puerta de platform/auth: JWT y guard para proteger las rutas de la app movil
export { firmarToken, verificarToken } from './jwt';
export type { PayloadToken } from './jwt';
export { JwtAuthGuard } from './jwt-auth.guard';
export { UsuarioActual } from './usuario-actual.decorator';
