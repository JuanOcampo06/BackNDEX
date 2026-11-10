import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { Riesgo, TipoTramo } from './catalogos';
import { TramoMedible } from './costos';
import { IndiceEspacial, PuntoConId } from './indice-espacial';
import { UnionFind } from './union-find';
import { normalizarRiesgo, ViaCiclista } from './via-ciclista';

// Hasta que distancia se une el origen o el destino a la red y mas lejos de una ciclovia no hay ruta
export const ALCANCE_MAXIMO_M = 600;

// Ademas del nodo mas cercano se prueban los que estan hasta estos metros mas lejos que el
const MARGEN_ACCESO_M = 100;

// Cuantos nodos de acceso se prueban como maximo en el origen y en el destino
const MAXIMO_NODOS_DE_ACCESO = 12;

// Dos grupos de ciclovias separados por una calle se unen por esa calle si estan a menos de esta distancia
// con 300 metros quedan alcanzables unos de otros cerca del 83% de los pares de puntos de la red real
const RADIO_ENLACE_M = 300;

// Los puntos de grupos distintos que estan a menos de esta distancia siempre se enlazan
// es el caso de dos ciclovias a los lados de una calle o de una misma cuadra
// con la red real, 40 metros dejaban rutas de 2,4 veces la linea recta y con 150 bajan a 1,5
const ENLACE_CERCANO_M = 150;

export type Nodo = PuntoConId;

// Tramo que sale de un nodo hacia otro vecino
export interface Arista extends TramoMedible {
  hacia: number;
}

// Mapa de ciclovias convertido en puntos conectados entre si
export interface RedVial {
  nodos: Map<number, Nodo>;
  aristas: Map<number, Arista[]>;
  // Es true cuando al menos una ciclovia ya tiene riesgo calculado
  hayRiesgo: boolean;
  indice: IndiceEspacial;
}

// Convierte las ciclovias en una red por la que se puede calcular un camino
// cada via une sus nodos seguidos y los nodos que dos vias comparten las conectan entre si
export function construirRed(vias: ViaCiclista[]): RedVial {
  const nodos = new Map<number, Nodo>();
  const aristas = new Map<number, Arista[]>();
  let hayRiesgo = false;
  for (const via of vias) {
    if (via.nodos.length !== via.coordenadas.length) {
      continue;
    }
    const riesgo = normalizarRiesgo(via.riesgo);
    hayRiesgo = hayRiesgo || riesgo !== null;
    via.nodos.forEach((id, i) => nodos.set(id, { id, latitud: via.coordenadas[i][0], longitud: via.coordenadas[i][1] }));
    for (let i = 1; i < via.nodos.length; i++) {
      conectar(nodos, aristas, via.nodos[i - 1], via.nodos[i], via.tipo, riesgo);
    }
  }
  const indice = new IndiceEspacial(nodos.values());
  unirGruposCercanos(nodos, aristas, indice);
  return { nodos, aristas, hayRiesgo, indice };
}

// Nodo por el que el origen o el destino entran a la red y a cuantos metros esta
export interface NodoDeAcceso {
  nodo: Nodo;
  distanciaM: number;
}

// Nodos de la red por los que se puede entrar o salir desde el punto, del mas cercano al mas lejano
// son el mas cercano y los que estan hasta MARGEN_ACCESO_M metros mas lejos que el, porque a veces el mas cercano
// queda en un ramal y obliga a devolverse y otro un poco mas lejos da una ruta mejor
// devuelve una lista vacia si ningun nodo esta a menos de alcanceM
export function nodosDeAcceso(red: RedVial, punto: Punto, alcanceM: number = ALCANCE_MAXIMO_M): NodoDeAcceso[] {
  const ordenados = red.indice
    .cercanos(punto, alcanceM)
    .map((nodo) => ({ nodo, distanciaM: distanciaEntre(punto, nodo) }))
    .sort((a, b) => a.distanciaM - b.distanciaM);
  if (ordenados.length === 0) {
    return [];
  }
  const limite = ordenados[0].distanciaM + MARGEN_ACCESO_M;
  return ordenados.filter((acceso) => acceso.distanciaM <= limite).slice(0, MAXIMO_NODOS_DE_ACCESO);
}

// Agrega el tramo en los dos sentidos porque la ciclovia se puede recorrer de ida y de vuelta
function conectar(
  nodos: Map<number, Nodo>,
  aristas: Map<number, Arista[]>,
  desde: number,
  hasta: number,
  tipo: TipoTramo,
  riesgo: Riesgo | null,
): void {
  if (desde === hasta) {
    return;
  }
  const distanciaM = distanciaEntre(nodos.get(desde) as Nodo, nodos.get(hasta) as Nodo);
  agregar(aristas, desde, { hacia: hasta, distanciaM, tipo, riesgo });
  agregar(aristas, hasta, { hacia: desde, distanciaM, tipo, riesgo });
}

function agregar(aristas: Map<number, Arista[]>, desde: number, arista: Arista): void {
  const salientes = aristas.get(desde);
  if (salientes === undefined) {
    aristas.set(desde, [arista]);
  } else {
    salientes.push(arista);
  }
}

interface Enlace {
  a: number;
  b: number;
  distanciaM: number;
}

// Las ciclovias de OpenStreetMap quedan en muchos grupos sueltos porque entre ellos hay calles normales
// aqui se unen esos grupos con tramos de tipo conexion: primero los mas cortos y solo los que de verdad juntan grupos distintos
function unirGruposCercanos(nodos: Map<number, Nodo>, aristas: Map<number, Arista[]>, indice: IndiceEspacial): void {
  const grupos = new UnionFind();
  for (const [id, salientes] of aristas) {
    salientes.forEach((arista) => grupos.unir(id, arista.hacia));
  }
  const grupoInicial = new Map<number, number>();
  for (const id of nodos.keys()) {
    grupoInicial.set(id, grupos.raiz(id));
  }
  const candidatos = buscarEnlaces(nodos, grupoInicial, indice);
  for (const enlace of candidatos) {
    const juntaGrupos = grupos.unir(enlace.a, enlace.b);
    if (juntaGrupos || enlace.distanciaM <= ENLACE_CERCANO_M) {
      conectar(nodos, aristas, enlace.a, enlace.b, 'conexion', null);
    }
  }
}

// Para cada nodo busca el nodo mas cercano de cada otro grupo y devuelve los enlaces posibles del mas corto al mas largo
function buscarEnlaces(nodos: Map<number, Nodo>, grupoInicial: Map<number, number>, indice: IndiceEspacial): Enlace[] {
  const vistos = new Set<string>();
  const enlaces: Enlace[] = [];
  for (const nodo of nodos.values()) {
    const mejorPorGrupo = new Map<number, Enlace>();
    for (const otro of indice.cercanos(nodo, RADIO_ENLACE_M)) {
      const grupo = grupoInicial.get(otro.id) as number;
      if (grupo === grupoInicial.get(nodo.id)) {
        continue;
      }
      const distanciaM = distanciaEntre(nodo, otro);
      if (distanciaM < (mejorPorGrupo.get(grupo)?.distanciaM ?? Infinity)) {
        mejorPorGrupo.set(grupo, { a: nodo.id, b: otro.id, distanciaM });
      }
    }
    for (const enlace of mejorPorGrupo.values()) {
      const clave = `${Math.min(enlace.a, enlace.b)}-${Math.max(enlace.a, enlace.b)}`;
      if (!vistos.has(clave)) {
        vistos.add(clave);
        enlaces.push(enlace);
      }
    }
  }
  return enlaces.sort((x, y) => x.distanciaM - y.distanciaM);
}
