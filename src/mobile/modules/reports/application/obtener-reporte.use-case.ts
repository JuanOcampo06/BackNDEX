import { Reporte } from '../domain/reporte';
import { ReporteNoEncontradoError } from '../domain/reporte-no-encontrado.error';
import { ReportesRepositoryPort } from './reportes.repository.port';

// Devuelve un reporte por su id o avisa que no existe
export class ObtenerReporteUseCase {
  constructor(private readonly reportes: ReportesRepositoryPort) {}

  async execute(id: number): Promise<Reporte> {
    const reporte = await this.reportes.buscarPorId(id);
    if (reporte === null) {
      throw new ReporteNoEncontradoError(id);
    }
    return reporte;
  }
}
