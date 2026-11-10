import { ViaCiclista } from '../domain/via-ciclista';

export const RED_CICLOVIAS_REPOSITORY = Symbol('RED_CICLOVIAS_REPOSITORY');

// Puerto para leer todas las ciclovias sobre las que se calculan las rutas sin saber de que base de datos vienen
// mientras los datos no cambien debe devolver siempre la misma lista porque asi el caso de uso no arma la red de nuevo
export interface RedCicloviasRepositoryPort {
  obtenerVias(): Promise<ViaCiclista[]>;
}
