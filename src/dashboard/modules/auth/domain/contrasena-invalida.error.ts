import { DomainError } from '../../../../shared/domain-error';

// La contrasena nueva no cumple las reglas de largo mayuscula minuscula y numero
export class ContrasenaInvalidaError extends DomainError {
  constructor(mensaje: string) {
    super('CONTRASENA_INVALIDA', mensaje);
  }
}
