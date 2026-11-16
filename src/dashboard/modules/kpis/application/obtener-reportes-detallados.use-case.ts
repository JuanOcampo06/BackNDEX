import { FiltrosTablero } from '../domain/filtros-tablero';
import { ReporteDetallado, TableroRepositoryPort } from './tablero.repository.port';

// Reportes uno por uno con su localidad vehiculo y mes para la hoja Reportes del Excel
export class ObtenerReportesDetalladosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  execute(filtros: FiltrosTablero): Promise<ReporteDetallado[]> {
    return this.tablero.listarReportes(filtros);
  }
}
