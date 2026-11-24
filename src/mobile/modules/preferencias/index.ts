// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { PreferenciasModule } from './preferencias.module';
export { AVATARES, DISTANCIAS_ALERTA_M, TEMAS } from './domain/preferencias';
export type { Avatar, DistanciaAlertaM, Preferencias, Tema } from './domain/preferencias';
export { ObtenerPreferenciasUseCase } from './application/obtener-preferencias.use-case';
export { ActualizarPreferenciasUseCase } from './application/actualizar-preferencias.use-case';
export { PREFERENCIAS_REPOSITORY } from './application/preferencias.repository.port';
export type { PreferenciasRepositoryPort } from './application/preferencias.repository.port';
