// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { ReportsModule } from './reports.module';
export { CATEGORIAS_REPORTE, ESTADOS_REPORTE, SUBCATEGORIAS_POR_CATEGORIA, SUBCATEGORIAS_REPORTE } from './domain/catalogos';
export type { CategoriaReporte, EstadoReporte, SubcategoriaReporte } from './domain/catalogos';
export type { Reporte } from './domain/reporte';
export { TIPOS_VEHICULO } from '../../../shared/tipos-vehiculo';
export type { TipoVehiculo } from '../../../shared/tipos-vehiculo';
export { DomainError } from '../../../shared/domain-error';
export { CrearReporteUseCase } from './application/crear-reporte.use-case';
export { ListarReportesUseCase } from './application/listar-reportes.use-case';
export { ObtenerReporteUseCase } from './application/obtener-reporte.use-case';
