import { FiltrosTablero } from '../domain/filtros-tablero';
import { SiniestroEnMapa, TableroRepositoryPort } from './tablero.repository.port';

export interface MapaSiniestros {
  siniestros: SiniestroEnMapa[];
}

// Puntos de siniestros para el mapa principal
// las ciclovias del mapa salen aparte del endpoint ciclovias que trabaja por zona
export class ObtenerMapaSiniestrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<MapaSiniestros> {
    const siniestros = await this.tablero.listarSiniestros(filtros);
    return { siniestros };
  }
}
