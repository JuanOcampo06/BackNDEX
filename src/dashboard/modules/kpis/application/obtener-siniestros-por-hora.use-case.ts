import { Franja, franjaDeHora } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { TableroRepositoryPort } from './tablero.repository.port';

const HORAS_DEL_DIA = 24;

export interface SiniestrosEnHora {
  hora: number;
  franja: Franja;
  total: number;
}

// Siniestros de cada una de las 24 horas del dia con su franja para dar color a la barra
export class ObtenerSiniestrosPorHoraUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<SiniestrosEnHora[]> {
    const conteos = await this.tablero.contarSiniestrosPorLugarYHora(filtros);
    const totales = new Array<number>(HORAS_DEL_DIA).fill(0);
    for (const conteo of conteos) {
      totales[conteo.hora] += conteo.total;
    }
    return totales.map((total, hora) => ({ hora, franja: franjaDeHora(hora), total }));
  }
}
