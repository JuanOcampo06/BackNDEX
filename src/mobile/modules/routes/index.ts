// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { RoutesModule } from './routes.module';
export { CRITERIOS_RUTA, TIPOS_PASO } from './domain/catalogos';
export type { CriterioRuta, TipoPaso } from './domain/catalogos';
export type { Ruta } from './domain/ruta';
export type { PasoRuta } from './domain/maniobras';
export type { ResultadoRutas } from './application/calcular-rutas.use-case';
export { DomainError } from '../../../shared/domain-error';
export { CalcularRutasUseCase } from './application/calcular-rutas.use-case';
