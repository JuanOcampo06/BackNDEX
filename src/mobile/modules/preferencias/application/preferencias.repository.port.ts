import { Preferencias } from '../domain/preferencias';

export const PREFERENCIAS_REPOSITORY = Symbol('PREFERENCIAS_REPOSITORY');

// Puerto para guardar las preferencias de cada ciudadano sin saber en que base de datos quedan
export interface PreferenciasRepositoryPort {
  // null si el ciudadano nunca ha guardado nada
  buscar(usuarioId: number): Promise<Preferencias | null>;
  // false si el ciudadano no existe
  guardar(usuarioId: number, preferencias: Preferencias): Promise<boolean>;
}
