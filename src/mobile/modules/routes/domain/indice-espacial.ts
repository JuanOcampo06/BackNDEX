import { distanciaEntre, Punto } from '../../../../shared/distancia';

// Lado de cada casilla de la cuadricula en grados y 0,003 son unos 330 metros
const LADO_CASILLA_GRADOS = 0.003;
const METROS_POR_GRADO = 111_000;
const LADO_CASILLA_M = LADO_CASILLA_GRADOS * METROS_POR_GRADO;

export interface PuntoConId extends Punto {
  id: number;
}

// Cuadricula que reparte los puntos por casillas para buscar los cercanos sin revisar todos los de la red
export class IndiceEspacial {
  private readonly casillas = new Map<string, PuntoConId[]>();

  constructor(puntos: Iterable<PuntoConId>) {
    for (const punto of puntos) {
      const clave = this.claveDe(this.fila(punto.latitud), this.fila(punto.longitud));
      const casilla = this.casillas.get(clave);
      if (casilla === undefined) {
        this.casillas.set(clave, [punto]);
      } else {
        casilla.push(punto);
      }
    }
  }

  // Puntos que estan como maximo a radioM metros del punto dado y sin ningun orden
  cercanos(punto: Punto, radioM: number): PuntoConId[] {
    const alcance = Math.ceil(radioM / LADO_CASILLA_M);
    const fila = this.fila(punto.latitud);
    const columna = this.fila(punto.longitud);
    const encontrados: PuntoConId[] = [];
    for (let di = -alcance; di <= alcance; di++) {
      for (let dj = -alcance; dj <= alcance; dj++) {
        for (const candidato of this.casillas.get(this.claveDe(fila + di, columna + dj)) ?? []) {
          if (distanciaEntre(punto, candidato) <= radioM) {
            encontrados.push(candidato);
          }
        }
      }
    }
    return encontrados;
  }

  private fila(grados: number): number {
    return Math.floor(grados / LADO_CASILLA_GRADOS);
  }

  private claveDe(fila: number, columna: number): string {
    return `${fila}:${columna}`;
  }
}
