import { DomainError } from '../../../../shared/domain-error';

// El viaje no cumple las reglas del negocio
export class ViajeInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('VIAJE_INVALIDO', mensaje);
  }
}
