// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { MobileAuthModule } from './auth.module';
export { GENEROS } from './domain/catalogos';
export type { Genero } from './domain/catalogos';
export type { Ciudadano } from './domain/ciudadano';
export type { Sesion } from './application/sesion';
export { DomainError } from '../../../shared/domain-error';
export { RegistrarCiudadanoUseCase } from './application/registrar-ciudadano.use-case';
export { IniciarSesionUseCase } from './application/iniciar-sesion.use-case';
