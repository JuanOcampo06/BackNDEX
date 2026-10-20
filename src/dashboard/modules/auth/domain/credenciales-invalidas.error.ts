import { DomainError } from '../../../../shared/domain-error';

// Mensaje genérico a propósito: no revela si falló el correo o la contraseña.
export class CredencialesInvalidasError extends DomainError {
  constructor() {
    super('CREDENCIALES_INVALIDAS', 'Correo o contraseña incorrectos');
  }
}
