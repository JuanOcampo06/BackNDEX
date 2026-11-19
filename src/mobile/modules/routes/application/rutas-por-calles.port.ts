import { Punto } from '../../../../shared/distancia';

// La infraestructura toma el tipo desde aqui porque no puede importar shared
export type { Punto };

export const RUTAS_POR_CALLES = Symbol('RUTAS_POR_CALLES');

// Puerto para trazar caminos por las calles sin saber que servicio de mapas lo hace
// devuelve hasta tres caminos distintos para ir del origen al destino, cada uno con sus puntos en orden, y una lista vacia cuando no se pudo trazar ninguno
export interface RutasPorCallesPort {
  alternativasPorCalles(origen: Punto, destino: Punto): Promise<Punto[][]>;
  // Un camino por las calles que pasa por los puntos intermedios en orden, o null si no se pudo trazar
  rutaPorPuntos(origen: Punto, destino: Punto, intermedios: Punto[]): Promise<Punto[] | null>;
}
