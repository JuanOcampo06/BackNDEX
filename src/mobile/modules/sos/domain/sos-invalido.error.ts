import { DomainError } from '../../../../shared/domain-error';

// La activacion no cumple las reglas del negocio
export class SosInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('SOS_INVALIDO', mensaje);
  }
}
