// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { ReportsModule } from './reports.module';
export { CATEGORIAS_REPORTE, ESTADOS_REPORTE } from './domain/catalogos';
export type { CategoriaReporte, EstadoReporte } from './domain/catalogos';
export type { Reporte } from './domain/reporte';
export { DomainError } from '../../../shared/domain-error';
export { CrearReporteUseCase } from './application/crear-reporte.use-case';
export { ListarReportesUseCase } from './application/listar-reportes.use-case';
export { ObtenerReporteUseCase } from './application/obtener-reporte.use-case';
