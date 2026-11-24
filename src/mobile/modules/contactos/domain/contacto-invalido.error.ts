import { DomainError } from '../../../../shared/domain-error';

// Algun dato del contacto de emergencia no cumple las reglas de la app
export class ContactoInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('CONTACTO_INVALIDO', mensaje);
  }
}
