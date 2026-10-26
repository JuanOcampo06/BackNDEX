import { DomainError } from '../../../../shared/domain-error';

// Dos usuarios del dashboard no pueden tener el mismo correo
export class CorreoDuplicadoError extends DomainError {
  constructor(correo: string) {
    super('CORREO_DUPLICADO', `Ya existe un usuario con el correo ${correo}`);
  }
}
