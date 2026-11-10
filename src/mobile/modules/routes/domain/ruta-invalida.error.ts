import { DomainError } from '../../../../shared/domain-error';

// El origen o el destino no cumplen las reglas del negocio
export class RutaInvalidaError extends DomainError {
  constructor(mensaje: string) {
    super('RUTA_INVALIDA', mensaje);
  }
}
