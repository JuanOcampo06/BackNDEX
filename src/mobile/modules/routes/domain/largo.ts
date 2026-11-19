import { distanciaEntre, Punto } from '../../../../shared/distancia';

// Metros que mide una linea que pasa por los puntos en orden
export function largoDe(puntos: Punto[]): number {
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    total += distanciaEntre(puntos[i - 1], puntos[i]);
  }
  return total;
}
