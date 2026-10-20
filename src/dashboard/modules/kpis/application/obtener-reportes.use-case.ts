import { FiltrosTablero } from '../domain/filtros-tablero';
import { ReporteEnMapa, TableroRepositoryPort } from './tablero.repository.port';

export interface ReportesPorCategoria {
  categoria: string;
  total: number;
}

export interface Reportes {
  total: number;
  puntos: ReporteEnMapa[];
  porCategoria: ReportesPorCategoria[];
}

// Puntos de los reportes ciudadanos para el mapa y su conteo por categoria
export class ObtenerReportesUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<Reportes> {
    const puntos = await this.tablero.listarReportes(filtros);
    const totalPorCategoria = new Map<string, number>();
    for (const reporte of puntos) {
      totalPorCategoria.set(reporte.categoria, (totalPorCategoria.get(reporte.categoria) ?? 0) + 1);
    }
    const porCategoria = [...totalPorCategoria.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
    return { total: puntos.length, puntos, porCategoria };
  }
}
