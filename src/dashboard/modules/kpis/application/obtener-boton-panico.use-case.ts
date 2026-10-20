import { sumarTotales } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ConteoPorLugar, TableroRepositoryPort } from './tablero.repository.port';

const CANTIDAD_UBICACIONES = 5;

export interface BotonPanico {
  total: number;
  lugares: ConteoPorLugar[];
  topUbicaciones: ConteoPorLugar[];
}

// Activaciones del boton de panico por lugar para los circulos del mapa y la lista de las cinco ubicaciones con mas activaciones
export class ObtenerBotonPanicoUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<BotonPanico> {
    const lugares = await this.tablero.contarActivacionesPorLugar(filtros);
    const ordenados = [...lugares].sort((a, b) => b.total - a.total);
    return {
      total: sumarTotales(lugares),
      lugares: ordenados,
      topUbicaciones: ordenados.slice(0, CANTIDAD_UBICACIONES),
    };
  }
}
