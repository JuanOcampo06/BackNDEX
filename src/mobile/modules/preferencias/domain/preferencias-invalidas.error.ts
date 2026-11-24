import { DomainError } from '../../../../shared/domain-error';

// Algun valor de las preferencias no es una de las opciones de la app
export class PreferenciasInvalidasError extends DomainError {
  constructor(mensaje: string) {
    super('PREFERENCIAS_INVALIDAS', mensaje);
  }
}
