import { FiltrosTablero } from '../domain/filtros-tablero';
import { SiniestroDetallado, TableroRepositoryPort } from './tablero.repository.port';

// Siniestros uno por uno con su localidad para la hoja Mapa de siniestros del Excel
export class ObtenerSiniestrosDetalladosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  execute(filtros: FiltrosTablero): Promise<SiniestroDetallado[]> {
    return this.tablero.listarSiniestros(filtros);
  }
}
