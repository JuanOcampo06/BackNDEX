import { CategoriaReporte } from '../domain/catalogos';
import { NuevoReporte, Reporte } from '../domain/reporte';

export const REPORTES_REPOSITORY = Symbol('REPORTES_REPOSITORY');

// Filtros opcionales para listar reportes
export interface FiltrosReportes {
  usuarioId?: number;
  categoria?: CategoriaReporte;
}

// Puerto que el modulo necesita para guardar y leer reportes sin saber de que base de datos vienen
export interface ReportesRepositoryPort {
  existeUsuario(usuarioId: number): Promise<boolean>;
  guardar(reporte: NuevoReporte): Promise<Reporte>;
  listar(filtros: FiltrosReportes): Promise<Reporte[]>;
  buscarPorId(id: number): Promise<Reporte | null>;
}
