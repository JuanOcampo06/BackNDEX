// Única puerta del módulo: el BFF solo puede importar lo que se exporta aquí.
export { AuthModule } from './auth.module';
export { LoginUseCase } from './application/login.use-case';
export type { LoginCommand, LoginResult } from './application/login.use-case';
export { SolicitarRestablecimientoUseCase } from './application/solicitar-restablecimiento.use-case';
export { CambiarContrasenaUseCase } from './application/cambiar-contrasena.use-case';
export { ConfirmarRestablecimientoUseCase } from './application/confirmar-restablecimiento.use-case';
export { ObtenerEstadoDeAccesoUseCase } from './application/obtener-estado-de-acceso.use-case';
export type { EstadoDeAcceso } from './application/obtener-estado-de-acceso.use-case';
export { DomainError } from '../../../shared/domain-error';
