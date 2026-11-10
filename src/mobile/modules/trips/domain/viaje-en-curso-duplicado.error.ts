import { DomainError } from '../../../../shared/domain-error';

// Un ciudadano solo puede tener un viaje en curso a la vez
export class ViajeEnCursoDuplicadoError extends DomainError {
  constructor(viajeId: number) {
    super('VIAJE_EN_CURSO_DUPLICADO', `Ya tienes el viaje ${viajeId} en curso y debes finalizarlo antes de iniciar otro`);
  }
}
