import { SiniestroUbicado } from '../domain/indice-siniestros';

export const SINIESTROS_REPOSITORY = Symbol('SINIESTROS_REPOSITORY');

// Puerto para leer donde ocurrieron los siniestros del anuario sin saber de que base de datos vienen
// mientras los datos no cambien debe devolver siempre la misma lista porque asi el caso de uso no arma el indice de nuevo
export interface SiniestrosRepositoryPort {
  obtenerSiniestros(): Promise<SiniestroUbicado[]>;
}
