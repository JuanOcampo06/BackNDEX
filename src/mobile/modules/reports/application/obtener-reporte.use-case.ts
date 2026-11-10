import { Reporte } from '../domain/reporte';
import { ReporteNoEncontradoError } from '../domain/reporte-no-encontrado.error';
import { ReportesRepositoryPort } from './reportes.repository.port';

// Devuelve un reporte del ciudadano por su id o avisa que no existe
// el reporte de otro ciudadano responde igual que uno que no existe
export class ObtenerReporteUseCase {
  constructor(private readonly reportes: ReportesRepositoryPort) {}

  async execute(id: number, usuarioId: number): Promise<Reporte> {
    const reporte = await this.reportes.buscarPorId(id);
    if (reporte === null || reporte.usuarioId !== usuarioId) {
      throw new ReporteNoEncontradoError(id);
    }
    return reporte;
  }
}
