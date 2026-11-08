import { Reporte } from '../domain/reporte';
import { FiltrosReportes, ReportesRepositoryPort } from './reportes.repository.port';

// Lista los reportes mas recientes primero y se puede filtrar por ciudadano categoria y subcategoria
export class ListarReportesUseCase {
  constructor(private readonly reportes: ReportesRepositoryPort) {}

  execute(filtros: FiltrosReportes): Promise<Reporte[]> {
    return this.reportes.listar(filtros);
  }
}
