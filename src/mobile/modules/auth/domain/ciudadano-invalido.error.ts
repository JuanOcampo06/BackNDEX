import { DomainError } from '../../../../shared/domain-error';

// Los datos del registro no cumplen las reglas del negocio
export class CiudadanoInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('CIUDADANO_INVALIDO', mensaje);
  }
}
