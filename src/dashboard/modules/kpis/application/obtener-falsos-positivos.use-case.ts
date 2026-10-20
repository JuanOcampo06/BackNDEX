import { porcentaje, sumarTotales } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ConteoMensual, TableroRepositoryPort } from './tablero.repository.port';

// La linea de evolucion muestra un anio completo hasta el mes final del filtro
const MESES_DE_EVOLUCION = 12;

export interface FalsosPositivosPorMotivo {
  motivo: string;
  total: number;
  porcentaje: number;
}

export interface FalsosPositivos {
  total: number;
  porcentajeDeReportes: number;
  porMotivo: FalsosPositivosPorMotivo[];
  evolucionMensual: ConteoMensual[];
}

// Reportes descartados como falsos positivos con sus motivos y su evolucion por mes
export class ObtenerFalsosPositivosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<FalsosPositivos> {
    const periodoEvolucion = filtros.periodo.ultimosMeses(MESES_DE_EVOLUCION);
    const [motivos, reportes, conteosPorMes] = await Promise.all([
      this.tablero.contarFalsosPositivosPorMotivo(filtros),
      this.tablero.contarPorSemana('reportes', filtros),
      this.tablero.contarFalsosPositivosPorMes({ ...filtros, periodo: periodoEvolucion }),
    ]);
    const total = sumarTotales(motivos);
    const totalPorMes = new Map(conteosPorMes.map((conteo) => [conteo.mes, conteo.total]));
    return {
      total,
      porcentajeDeReportes: porcentaje(total, sumarTotales(reportes)),
      porMotivo: motivos.map(({ motivo, total: totalMotivo }) => ({
        motivo,
        total: totalMotivo,
        porcentaje: porcentaje(totalMotivo, total),
      })),
      // Los meses sin falsos positivos salen en cero para que la linea no se corte
      evolucionMensual: periodoEvolucion.meses().map((mes) => ({ mes, total: totalPorMes.get(mes) ?? 0 })),
    };
  }
}
