// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { KpisModule } from './kpis.module';
export { FUENTES, TIPOS_VEHICULO } from './domain/catalogos';
export type { Fuente, Indicador, TipoVehiculo } from './domain/catalogos';
export { Periodo } from './domain/periodo';
export type { FiltrosTablero } from './domain/filtros-tablero';
export { DomainError } from '../../../shared/domain-error';
export { ObtenerFiltrosUseCase } from './application/obtener-filtros.use-case';
export { ObtenerTarjetaUseCase } from './application/obtener-tarjeta.use-case';
export { ObtenerMapaSiniestrosUseCase } from './application/obtener-mapa-siniestros.use-case';
export { ObtenerLugaresConMasSiniestrosUseCase } from './application/obtener-lugares-con-mas-siniestros.use-case';
export { ObtenerSiniestrosPorHoraUseCase } from './application/obtener-siniestros-por-hora.use-case';
export { ObtenerTendenciaMensualUseCase } from './application/obtener-tendencia-mensual.use-case';
export { ObtenerSiniestrosPorSexoYEdadUseCase } from './application/obtener-siniestros-por-sexo-y-edad.use-case';
export { ObtenerUsuariosPorTipoUseCase } from './application/obtener-usuarios-por-tipo.use-case';
export { ObtenerBotonPanicoUseCase } from './application/obtener-boton-panico.use-case';
export { ObtenerReportesUseCase } from './application/obtener-reportes.use-case';
export { ObtenerFalsosPositivosUseCase } from './application/obtener-falsos-positivos.use-case';
