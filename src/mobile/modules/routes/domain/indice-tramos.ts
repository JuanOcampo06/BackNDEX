import { Punto } from '../../../../shared/distancia';
import { Riesgo } from './catalogos';
import { PENALIZACION_POR_RIESGO } from './costos';
import { normalizarRiesgo, ViaCiclista } from './via-ciclista';

// Metros que mide un grado en Bogota con una proyeccion plana que sirve para distancias cortas
const METROS_POR_GRADO = 110_800;

// Tamano de cada casilla de la cuadricula en grados (unos 220 metros)
const CASILLA_GRADOS = 0.002;

interface Tramo {
  desde: Punto;
  hasta: Punto;
  tipo: 'ciclovia' | 'cruce';
  riesgo: Riesgo | null;
}

// Lo que se sabe de la ciclovia que pasa junto a un punto
export interface CicloviaCercana {
  tipo: 'ciclovia' | 'cruce';
  riesgo: Riesgo | null;
}

// Todos los tramos de ciclovia guardados en una cuadricula para encontrar rapido el que pasa junto a un punto
// sirve para medir cuanto de una ruta trazada por calles va pegado a una ciclovia
export class IndiceTramos {
  private readonly casillas = new Map<string, Tramo[]>();

  constructor(vias: ViaCiclista[]) {
    for (const via of vias) {
      const riesgo = normalizarRiesgo(via.riesgo);
      for (let i = 1; i < via.coordenadas.length; i++) {
        const desde = { latitud: via.coordenadas[i - 1][0], longitud: via.coordenadas[i - 1][1] };
        const hasta = { latitud: via.coordenadas[i][0], longitud: via.coordenadas[i][1] };
        this.guardar({ desde, hasta, tipo: via.tipo, riesgo });
      }
    }
  }

  // La ciclovia mas cercana al punto si esta a radioM metros o menos y null si no hay ninguna
  cercana(punto: Punto, radioM: number): CicloviaCercana | null {
    const fila = Math.floor(punto.latitud / CASILLA_GRADOS);
    const columna = Math.floor(punto.longitud / CASILLA_GRADOS);
    let mejor: Tramo | null = null;
    let menor = radioM;
    for (let i = fila - 1; i <= fila + 1; i++) {
      for (let j = columna - 1; j <= columna + 1; j++) {
        for (const tramo of this.casillas.get(`${i}|${j}`) ?? []) {
          const distancia = distanciaAlTramo(punto, tramo);
          if (distancia <= menor) {
            menor = distancia;
            mejor = tramo;
          }
        }
      }
    }
    return mejor === null ? null : { tipo: mejor.tipo, riesgo: mejor.riesgo };
  }

  // El punto de ciclovia mas conveniente cerca del punto dado: el que menos cuesta alejarse hasta el, contando mas el riesgo
  // las ciclovias de riesgo alto y los cruces no sirven y devuelve null si no hay ninguna dentro del radio
  anclajeCercano(punto: Punto, radioM: number): Punto | null {
    const casillas = Math.ceil(radioM / (CASILLA_GRADOS * METROS_POR_GRADO));
    const fila = Math.floor(punto.latitud / CASILLA_GRADOS);
    const columna = Math.floor(punto.longitud / CASILLA_GRADOS);
    let mejor: Punto | null = null;
    let menorCosto = Infinity;
    for (let i = fila - casillas; i <= fila + casillas; i++) {
      for (let j = columna - casillas; j <= columna + casillas; j++) {
        for (const tramo of this.casillas.get(`${i}|${j}`) ?? []) {
          if (tramo.tipo !== 'ciclovia' || tramo.riesgo === 'alto') {
            continue;
          }
          const { distancia, punto: proyectado } = proyectar(punto, tramo);
          const costo = distancia * (tramo.riesgo === null ? 1 : PENALIZACION_POR_RIESGO[tramo.riesgo]);
          if (distancia <= radioM && costo < menorCosto) {
            menorCosto = costo;
            mejor = proyectado;
          }
        }
      }
    }
    return mejor;
  }

  // El tramo queda en todas las casillas que toca su rectangulo
  private guardar(tramo: Tramo): void {
    const [filaMin, filaMax] = rango(tramo.desde.latitud, tramo.hasta.latitud);
    const [colMin, colMax] = rango(tramo.desde.longitud, tramo.hasta.longitud);
    for (let i = filaMin; i <= filaMax; i++) {
      for (let j = colMin; j <= colMax; j++) {
        const clave = `${i}|${j}`;
        const casilla = this.casillas.get(clave);
        if (casilla === undefined) {
          this.casillas.set(clave, [tramo]);
        } else {
          casilla.push(tramo);
        }
      }
    }
  }
}

function rango(a: number, b: number): [number, number] {
  return [Math.floor(Math.min(a, b) / CASILLA_GRADOS), Math.floor(Math.max(a, b) / CASILLA_GRADOS)];
}

// Metros desde el punto hasta el tramo y el punto del tramo que queda mas cerca
// se proyecta el punto sobre el tramo y se limita entre sus extremos
function proyectar(punto: Punto, tramo: Tramo): { distancia: number; punto: Punto } {
  const dx = (tramo.hasta.longitud - tramo.desde.longitud) * METROS_POR_GRADO;
  const dy = (tramo.hasta.latitud - tramo.desde.latitud) * METROS_POR_GRADO;
  const px = (punto.longitud - tramo.desde.longitud) * METROS_POR_GRADO;
  const py = (punto.latitud - tramo.desde.latitud) * METROS_POR_GRADO;
  const largoCuadrado = dx * dx + dy * dy;
  const u = largoCuadrado === 0 ? 0 : Math.max(0, Math.min(1, (px * dx + py * dy) / largoCuadrado));
  return {
    distancia: Math.hypot(px - u * dx, py - u * dy),
    punto: {
      latitud: tramo.desde.latitud + u * (tramo.hasta.latitud - tramo.desde.latitud),
      longitud: tramo.desde.longitud + u * (tramo.hasta.longitud - tramo.desde.longitud),
    },
  };
}

function distanciaAlTramo(punto: Punto, tramo: Tramo): number {
  return proyectar(punto, tramo).distancia;
}
