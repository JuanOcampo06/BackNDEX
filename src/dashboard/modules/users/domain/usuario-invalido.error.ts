import { DomainError } from '../../../../shared/domain-error';

// Los datos del usuario no cumplen las reglas del negocio
export class UsuarioInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('USUARIO_INVALIDO', mensaje);
  }
}
