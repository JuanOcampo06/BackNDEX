import { DomainError } from '../../../../shared/domain-error';

export class SosNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('SOS_NO_ENCONTRADO', `No existe la activacion ${id}`);
  }
}
