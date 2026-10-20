import { FiltrosTablero } from '../domain/filtros-tablero';
import { Cicloruta, SiniestroEnMapa, TableroRepositoryPort } from './tablero.repository.port';

export interface MapaSiniestros {
  siniestros: SiniestroEnMapa[];
  ciclorutas: Cicloruta[];
}

// Puntos de siniestros y trazado de ciclorutas para el mapa principal
// las ciclorutas no se filtran porque siempre deben verse
export class ObtenerMapaSiniestrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<MapaSiniestros> {
    const [siniestros, ciclorutas] = await Promise.all([
      this.tablero.listarSiniestros(filtros),
      this.tablero.listarCiclorutas(),
    ]);
    return { siniestros, ciclorutas };
  }
}
