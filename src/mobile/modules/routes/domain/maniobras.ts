import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { TipoPaso } from './catalogos';

// Maniobra que la app muestra, como "gira a la derecha"
// distanciaDesdeInicioM permite saber cuanto falta: es lo que lleva la ruta hasta ese punto menos lo que ya recorrio el ciudadano
export interface PasoRuta {
  tipo: TipoPaso;
  latitud: number;
  longitud: number;
  distanciaDesdeInicioM: number;
}

// A cuantos metros se mira hacia atras y hacia adelante para medir un giro
// asi las curvas suaves y los puntos muy juntos del mapa no se confunden con esquinas
const VENTANA_M = 25;

// Un cambio de rumbo menor a estos grados se considera seguir recto
const GIRO_MINIMO_GRADOS = 35;

// Un cambio de rumbo de al menos estos grados es devolverse
const GIRO_EN_U_GRADOS = 150;

// Maniobras de una ruta: la salida, cada giro y la llegada
// recibe los puntos de la ruta en orden y sin puntos repetidos seguidos
export function calcularPasos(puntos: Punto[]): PasoRuta[] {
  if (puntos.length < 2) {
    return [];
  }
  const acumulada = distanciasAcumuladas(puntos);
  const pasos: PasoRuta[] = [paso('salida', puntos[0], 0)];
  let ultimoGiro = -Infinity;
  for (let i = 1; i < puntos.length - 1; i++) {
    if (acumulada[i] - ultimoGiro < VENTANA_M) {
      continue;
    }
    const giro = giroEn(puntos, acumulada, i);
    if (Math.abs(giro) >= GIRO_MINIMO_GRADOS) {
      pasos.push(paso(tipoDeGiro(giro), puntos[i], acumulada[i]));
      ultimoGiro = acumulada[i];
    }
  }
  pasos.push(paso('llegada', puntos[puntos.length - 1], acumulada[acumulada.length - 1]));
  return pasos;
}

function paso(tipo: TipoPaso, punto: Punto, distanciaM: number): PasoRuta {
  return { tipo, latitud: punto.latitud, longitud: punto.longitud, distanciaDesdeInicioM: Math.round(distanciaM * 10) / 10 };
}

function tipoDeGiro(giro: number): TipoPaso {
  if (Math.abs(giro) >= GIRO_EN_U_GRADOS) return 'giro_en_u';
  return giro > 0 ? 'derecha' : 'izquierda';
}

function distanciasAcumuladas(puntos: Punto[]): number[] {
  const acumulada = [0];
  for (let i = 1; i < puntos.length; i++) {
    acumulada.push(acumulada[i - 1] + distanciaEntre(puntos[i - 1], puntos[i]));
  }
  return acumulada;
}

// Grados que se gira en el punto i: positivo es hacia la derecha y negativo hacia la izquierda
function giroEn(puntos: Punto[], acumulada: number[], i: number): number {
  let antes = i - 1;
  while (antes > 0 && acumulada[i] - acumulada[antes] < VENTANA_M) antes--;
  let despues = i + 1;
  while (despues < puntos.length - 1 && acumulada[despues] - acumulada[i] < VENTANA_M) despues++;
  const cambio = rumbo(puntos[i], puntos[despues]) - rumbo(puntos[antes], puntos[i]);
  return ((cambio + 540) % 360) - 180;
}

// Rumbo en grados desde el norte y hacia la derecha entre dos puntos
function rumbo(desde: Punto, hasta: Punto): number {
  const lat1 = (desde.latitud * Math.PI) / 180;
  const lat2 = (hasta.latitud * Math.PI) / 180;
  const dLon = ((hasta.longitud - desde.longitud) * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}
