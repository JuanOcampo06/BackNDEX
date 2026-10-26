import { DomainError } from '../../../../shared/domain-error';

// Los datos del reporte no cumplen las reglas del negocio
export class ReporteInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('REPORTE_INVALIDO', mensaje);
  }
}
