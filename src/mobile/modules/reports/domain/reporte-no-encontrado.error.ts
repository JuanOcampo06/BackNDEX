import { DomainError } from '../../../../shared/domain-error';

export class ReporteNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('REPORTE_NO_ENCONTRADO', `No existe el reporte ${id}`);
  }
}
