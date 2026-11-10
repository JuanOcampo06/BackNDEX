import { DomainError } from '../../../../shared/domain-error';

// Mensaje generico a proposito: no revela si fallo el correo o la contrasena
export class CredencialesInvalidasError extends DomainError {
  constructor() {
    super('CREDENCIALES_INVALIDAS', 'Correo o contrasena incorrectos');
  }
}
