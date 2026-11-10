import { coordenadasValidas } from '../../../../shared/coordenadas';
import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { RutaInvalidaError } from './ruta-invalida.error';

// Si el origen y el destino estan a menos de estos metros no hay nada que recorrer
const DISTANCIA_MINIMA_M = 30;

// Aplica las reglas del negocio al origen y al destino y los devuelve limpios
export function validarTrayecto(origen: Punto, destino: Punto): { origen: Punto; destino: Punto } {
  if (!coordenadasValidas(origen.latitud, origen.longitud)) {
    throw new RutaInvalidaError('La ubicacion de origen no es valida');
  }
  if (!coordenadasValidas(destino.latitud, destino.longitud)) {
    throw new RutaInvalidaError('La ubicacion de destino no es valida');
  }
  if (distanciaEntre(origen, destino) < DISTANCIA_MINIMA_M) {
    throw new RutaInvalidaError(`El origen y el destino deben estar a mas de ${DISTANCIA_MINIMA_M} metros`);
  }
  return {
    origen: { latitud: origen.latitud, longitud: origen.longitud },
    destino: { latitud: destino.latitud, longitud: destino.longitud },
  };
}
