import { FiltrosTablero } from '../domain/filtros-tablero';
import { SiniestroDetallado, SiniestroEnMapa, TableroRepositoryPort } from './tablero.repository.port';

export interface MapaSiniestros {
  siniestros: SiniestroEnMapa[];
}

// Puntos de siniestros para el mapa principal
// las ciclovias del mapa salen aparte del endpoint ciclovias que trabaja por zona
export class ObtenerMapaSiniestrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<MapaSiniestros> {
    const siniestros = await this.tablero.listarSiniestros(filtros);
    return { siniestros: siniestros.map(aPuntoDelMapa) };
  }
}

// El endpoint del mapa responde solo estos campos y la localidad queda para el Excel
function aPuntoDelMapa(siniestro: SiniestroDetallado): SiniestroEnMapa {
  const { id, latitud, longitud, gravedad, clase, tipoVehiculo, ocurridoEn } = siniestro;
  return { id, latitud, longitud, gravedad, clase, tipoVehiculo, ocurridoEn };
}
