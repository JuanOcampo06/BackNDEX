// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { MapaCalorModule } from './mapa-calor.module';
export type { PuntoDeCalor } from './domain/mapa-calor';
export type { MapaDeCalor } from './application/obtener-mapa-calor.use-case';
export { ObtenerMapaCalorUseCase } from './application/obtener-mapa-calor.use-case';
export { FUENTES_DE_CALOR } from './application/fuentes-de-calor.port';
export type { FuentesDeCalorPort } from './application/fuentes-de-calor.port';
