import { DomainError } from '../../../../shared/domain-error';

// Dos ciudadanos no pueden tener el mismo correo
export class CorreoDuplicadoError extends DomainError {
  constructor(correo: string) {
    super('CORREO_DUPLICADO', `Ya existe un ciudadano con el correo ${correo}`);
  }
}
