import { distanciaEntre } from '../../../../shared/distancia';
import { Ubicacion } from './viaje';

// Metros recorridos al pasar por todos los puntos en orden y redondeados a un decimal
export function distanciaRecorrida(puntos: Ubicacion[]): number {
  let total = 0;
  for (let i = 1; i < puntos.length; i++) {
    total += distanciaEntre(puntos[i - 1], puntos[i]);
  }
  return Math.round(total * 10) / 10;
}
