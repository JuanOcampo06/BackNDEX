import { porcentaje, sumarTotales } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { TableroRepositoryPort } from './tablero.repository.port';

const CANTIDAD_EN_EL_TOP = 5;

export interface AlertaDelTop {
  subcategoria: string;
  categoria: string;
  total: number;
  porcentaje: number;
}

export interface TopAlertas {
  totalAlertas: number;
  top: AlertaDelTop[];
}

// Las cinco subcategorias de alerta mas reportadas con su parte del total de alertas del periodo
// el total cuenta todas las alertas aunque no entren en el top
export class ObtenerTopAlertasUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<TopAlertas> {
    const conteos = await this.tablero.contarReportesPorSubcategoria(filtros);
    const totalAlertas = sumarTotales(conteos);
    // Con empate se ordena por nombre para que la respuesta no cambie de una consulta a otra
    const top = [...conteos]
      .sort((a, b) => b.total - a.total || a.subcategoria.localeCompare(b.subcategoria))
      .slice(0, CANTIDAD_EN_EL_TOP)
      .map((conteo) => ({ ...conteo, porcentaje: porcentaje(conteo.total, totalAlertas) }));
    return { totalAlertas, top };
  }
}
