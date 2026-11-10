import { DomainError } from '../../../../shared/domain-error';

export class ViajeNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('VIAJE_NO_ENCONTRADO', `No existe el viaje ${id}`);
  }
}
