import { CATEGORIAS_REPORTE } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ReporteDetallado, ReporteEnMapa, TableroRepositoryPort } from './tablero.repository.port';

export interface ReportesPorCategoria {
  categoria: string;
  total: number;
}

export interface Reportes {
  total: number;
  puntos: ReporteEnMapa[];
  porCategoria: ReportesPorCategoria[];
}

// Puntos de los reportes ciudadanos para el mapa y su conteo por categoria principal
// cada reporte trae su categoria principal asi que contar por ella ya suma todas sus subcategorias
export class ObtenerReportesUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<Reportes> {
    const puntos = (await this.tablero.listarReportes(filtros)).map(aPuntoDelMapa);
    const totalPorCategoria = new Map<string, number>();
    for (const reporte of puntos) {
      totalPorCategoria.set(reporte.categoria, (totalPorCategoria.get(reporte.categoria) ?? 0) + 1);
    }
    // Siempre salen las cuatro categorias aunque alguna no tenga reportes y la de mas reportes va primero
    const porCategoria = CATEGORIAS_REPORTE.map((categoria) => ({ categoria, total: totalPorCategoria.get(categoria) ?? 0 })).sort(
      (a, b) => b.total - a.total,
    );
    return { total: puntos.length, puntos, porCategoria };
  }
}

// El endpoint responde solo estos campos y la localidad el vehiculo y el mes quedan para el Excel
function aPuntoDelMapa(reporte: ReporteDetallado): ReporteEnMapa {
  const { id, latitud, longitud, categoria } = reporte;
  return { id, latitud, longitud, categoria };
}
