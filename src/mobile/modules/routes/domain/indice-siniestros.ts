import { Punto } from '../../../../shared/distancia';

// Metros que mide un grado en Bogota con una proyeccion plana que sirve para distancias cortas
const METROS_POR_GRADO = 110_800;

// Tamano de cada casilla de la cuadricula en grados (unos 110 metros)
const CASILLA_GRADOS = 0.001;

// Un siniestro con bicicleta pesa el doble y uno con muertos el triple, igual que en el riesgo de las ciclovias
const PESO_CON_BICICLETA = 2;
const PESO_CON_MUERTOS = 3;

// Siniestro del anuario con lo que se necesita para pesarlo
export interface SiniestroUbicado {
  latitud: number;
  longitud: number;
  conBicicleta: boolean;
  conMuertos: boolean;
}

interface SiniestroPesado {
  latitud: number;
  longitud: number;
  peso: number;
}

export function pesoDe(siniestro: SiniestroUbicado): number {
  return (siniestro.conBicicleta ? PESO_CON_BICICLETA : 1) * (siniestro.conMuertos ? PESO_CON_MUERTOS : 1);
}

// Todos los siniestros del anuario guardados en una cuadricula para sumar rapido los que hay alrededor de un punto
// sirve para saber cuantos siniestros hubo junto a cada trozo de una ruta, vaya por ciclovia o por calle
export class IndiceSiniestros {
  private readonly casillas = new Map<string, SiniestroPesado[]>();

  constructor(siniestros: SiniestroUbicado[]) {
    for (const siniestro of siniestros) {
      const clave = claveDe(siniestro);
      const pesado = { latitud: siniestro.latitud, longitud: siniestro.longitud, peso: pesoDe(siniestro) };
      const casilla = this.casillas.get(clave);
      if (casilla === undefined) {
        this.casillas.set(clave, [pesado]);
      } else {
        casilla.push(pesado);
      }
    }
  }

  // Suma de los pesos de los siniestros que ocurrieron a radioM metros o menos del punto
  pesoCerca(punto: Punto, radioM: number): number {
    const casillas = Math.ceil(radioM / (CASILLA_GRADOS * METROS_POR_GRADO));
    const fila = Math.floor(punto.latitud / CASILLA_GRADOS);
    const columna = Math.floor(punto.longitud / CASILLA_GRADOS);
    let total = 0;
    for (let i = fila - casillas; i <= fila + casillas; i++) {
      for (let j = columna - casillas; j <= columna + casillas; j++) {
        for (const siniestro of this.casillas.get(`${i}|${j}`) ?? []) {
          const metros = Math.hypot((siniestro.latitud - punto.latitud) * METROS_POR_GRADO, (siniestro.longitud - punto.longitud) * METROS_POR_GRADO);
          if (metros <= radioM) {
            total += siniestro.peso;
          }
        }
      }
    }
    return total;
  }
}

function claveDe(punto: Punto): string {
  return `${Math.floor(punto.latitud / CASILLA_GRADOS)}|${Math.floor(punto.longitud / CASILLA_GRADOS)}`;
}
