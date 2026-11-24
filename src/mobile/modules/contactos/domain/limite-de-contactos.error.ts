import { DomainError } from '../../../../shared/domain-error';
import { MAXIMO_CONTACTOS } from './contacto';

// El ciudadano ya tiene el maximo de contactos de emergencia
export class LimiteDeContactosError extends DomainError {
  constructor() {
    super('LIMITE_DE_CONTACTOS', `Solo se pueden tener ${MAXIMO_CONTACTOS} contactos de emergencia`);
  }
}
