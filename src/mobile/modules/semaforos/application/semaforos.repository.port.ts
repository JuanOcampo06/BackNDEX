import { AreaMapa } from '../domain/area-mapa';
import { Semaforo } from '../domain/semaforo';

export const SEMAFOROS_REPOSITORY = Symbol('SEMAFOROS_REPOSITORY');

// Puerto para leer los semaforos de las ciclorrutas sin saber de que base de datos vienen
export interface SemaforosRepositoryPort {
  buscarEnArea(area: AreaMapa): Promise<Semaforo[]>;
}
