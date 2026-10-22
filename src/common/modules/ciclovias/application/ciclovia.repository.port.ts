import { AreaMapa } from '../domain/area-mapa';
import { Ciclovia, TipoCiclovia } from '../domain/ciclovia';

export const CICLOVIA_REPOSITORY = Symbol('CICLOVIA_REPOSITORY');

// Puerto para leer ciclovias sin saber de que base de datos vienen
export interface CicloviaRepositoryPort {
  // Devuelve las ciclovias que tocan el area y si llega tipo solo las de ese tipo
  buscarEnArea(area: AreaMapa, tipo?: TipoCiclovia): Promise<Ciclovia[]>;
}
