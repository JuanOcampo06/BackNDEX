import { FiltrosTablero } from '../domain/filtros-tablero';
import { TableroRepositoryPort } from './tablero.repository.port';

const MESES_POR_ANIO = 12;

export interface PuntoTendencia {
  mes: number;
  totalAnioActual: number | null;
  totalAnioAnterior: number | null;
}

export interface TendenciaMensual {
  anioActual: number;
  anioAnterior: number;
  mesesFiltrados: string[];
  meses: PuntoTendencia[];
}

// Siniestros de cada mes del anio actual contra el anio anterior
// los meses sin datos salen en null para que la linea se corte
export class ObtenerTendenciaMensualUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<TendenciaMensual> {
    const anioActual = filtros.periodo.anioFinal;
    const anioAnterior = anioActual - 1;
    const conteos = await this.tablero.contarSiniestrosPorMes({
      ...filtros,
      periodo: filtros.periodo.aniosDeComparacion(),
    });
    const totalPorMes = new Map(conteos.map((conteo) => [conteo.mes, conteo.total]));
    const totalDe = (anio: number, mes: number) => totalPorMes.get(`${anio}-${String(mes).padStart(2, '0')}`) ?? null;
    const meses = Array.from({ length: MESES_POR_ANIO }, (_, indice) => ({
      mes: indice + 1,
      totalAnioActual: totalDe(anioActual, indice + 1),
      totalAnioAnterior: totalDe(anioAnterior, indice + 1),
    }));
    return { anioActual, anioAnterior, mesesFiltrados: filtros.periodo.meses(), meses };
  }
}
