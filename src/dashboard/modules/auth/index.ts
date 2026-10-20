// Única puerta del módulo: el BFF solo puede importar lo que se exporta aquí.
export { AuthModule } from './auth.module';
export { LoginUseCase } from './application/login.use-case';
export type { LoginCommand, LoginResult } from './application/login.use-case';
export { DomainError } from '../../../shared/domain-error';
