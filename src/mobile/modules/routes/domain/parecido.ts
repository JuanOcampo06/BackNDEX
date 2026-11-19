import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { largoDe } from './largo';

// Dos caminos son el mismo si casi todo uno pasa a esta distancia o menos del otro
const TOLERANCIA_M = 30;

// Cuanto de un camino tiene que ir junto al otro para que sean el mismo
const PARTE_COMUN_MINIMA = 0.9;

// Cuantos puntos de cada camino se revisan
const MUESTRAS = 40;

// Metros que mide un grado en Bogota con una proyeccion plana que sirve para distancias cortas
const METROS_POR_GRADO = 110_800;

// Dice si dos caminos son en la practica el mismo aunque sus puntos no coincidan
// pasa cuando el servicio de mapas devuelve casi la misma ruta por dos caminos distintos y asi no se ofrecen dos opciones iguales
export function mismoCamino(a: Punto[], b: Punto[]): boolean {
  return parteJunto(a, b) >= PARTE_COMUN_MINIMA && parteJunto(b, a) >= PARTE_COMUN_MINIMA;
}

// Que parte de los puntos del camino va a la tolerancia o menos del otro camino
function parteJunto(camino: Punto[], otro: Punto[]): number {
  const muestras = muestrear(camino);
  const cerca = muestras.filter((punto) => distanciaAlCamino(punto, otro) <= TOLERANCIA_M);
  return cerca.length / muestras.length;
}

function muestrear(camino: Punto[]): Punto[] {
  const total = largoDe(camino);
  const puntos: Punto[] = [];
  for (let k = 0; k < MUESTRAS; k++) {
    puntos.push(puntoA(camino, (total * (k + 0.5)) / MUESTRAS));
  }
  return puntos;
}

function puntoA(camino: Punto[], metros: number): Punto {
  let recorrido = 0;
  for (let i = 1; i < camino.length; i++) {
    const tramo = distanciaEntre(camino[i - 1], camino[i]);
    if (recorrido + tramo >= metros) {
      const t = tramo === 0 ? 0 : (metros - recorrido) / tramo;
      return {
        latitud: camino[i - 1].latitud + (camino[i].latitud - camino[i - 1].latitud) * t,
        longitud: camino[i - 1].longitud + (camino[i].longitud - camino[i - 1].longitud) * t,
      };
    }
    recorrido += tramo;
  }
  return camino[camino.length - 1];
}

function distanciaAlCamino(punto: Punto, camino: Punto[]): number {
  let menor = Infinity;
  for (let i = 1; i < camino.length; i++) {
    const a = camino[i - 1];
    const b = camino[i];
    const dx = (b.longitud - a.longitud) * METROS_POR_GRADO;
    const dy = (b.latitud - a.latitud) * METROS_POR_GRADO;
    const px = (punto.longitud - a.longitud) * METROS_POR_GRADO;
    const py = (punto.latitud - a.latitud) * METROS_POR_GRADO;
    const largoCuadrado = dx * dx + dy * dy;
    const u = largoCuadrado === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / largoCuadrado));
    menor = Math.min(menor, Math.hypot(px - u * dx, py - u * dy));
  }
  return menor;
}
