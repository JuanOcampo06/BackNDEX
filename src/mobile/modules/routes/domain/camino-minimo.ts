import { ColaPrioridad } from './cola-prioridad';
import { Arista, RedVial } from './red-vial';

// Camino entre dos nodos: los nodos por los que pasa y el tramo que se recorre entre cada par seguido
export interface CaminoMinimo {
  nodos: number[];
  aristas: Arista[];
}

// Un nodo por el que se puede entrar o salir de la red y lo que cuesta llegar hasta el desde el origen o llegar al destino desde el
export interface Acceso {
  nodo: number;
  costo: number;
}

interface Llegada {
  desde: number;
  // Es null solo en el ultimo paso, que va del nodo de salida al destino
  arista: Arista | null;
}

// Nodo imaginario al que llegan todas las salidas para poder quedarse con la mejor combinacion de entrada y salida
const DESTINO_FINAL = -1;

// Algoritmo de Dijkstra: encuentra el camino de menor costo total desde cualquiera de las entradas hasta cualquiera de las salidas
// el costo de cada tramo lo decide quien llama y asi sirve igual para la ruta rapida y la segura
// con varias entradas y salidas la ruta no queda obligada a empezar por el nodo mas cercano, que a veces obliga a devolverse
// devuelve null cuando no hay forma de llegar
export function caminoMinimo(red: RedVial, entradas: Acceso[], salidas: Acceso[], costo: (arista: Arista) => number): CaminoMinimo | null {
  const costos = new Map<number, number>();
  const llegadas = new Map<number, Llegada>();
  const pendientes = new ColaPrioridad();
  const costoDeSalida = new Map<number, number>();
  for (const salida of salidas) {
    costoDeSalida.set(salida.nodo, Math.min(salida.costo, costoDeSalida.get(salida.nodo) ?? Infinity));
  }
  for (const entrada of entradas) {
    if (entrada.costo < (costos.get(entrada.nodo) ?? Infinity)) {
      costos.set(entrada.nodo, entrada.costo);
      pendientes.agregar(entrada.nodo, entrada.costo);
    }
  }

  while (!pendientes.vacia) {
    const { nodo, costo: costoActual } = pendientes.sacar();
    if (nodo === DESTINO_FINAL) {
      return reconstruir(llegadas);
    }
    // Una entrada vieja de la cola ya se mejoro con otra mas barata
    if (costoActual > (costos.get(nodo) ?? Infinity)) {
      continue;
    }
    const costoSalida = costoDeSalida.get(nodo);
    if (costoSalida !== undefined) {
      relajar(DESTINO_FINAL, costoActual + costoSalida, { desde: nodo, arista: null }, costos, llegadas, pendientes);
    }
    for (const arista of red.aristas.get(nodo) ?? []) {
      relajar(arista.hacia, costoActual + costo(arista), { desde: nodo, arista }, costos, llegadas, pendientes);
    }
  }
  return null;
}

// Si llegar a ese nodo por este camino sale mas barato que lo que se tenia, se guarda
function relajar(
  nodo: number,
  nuevoCosto: number,
  llegada: Llegada,
  costos: Map<number, number>,
  llegadas: Map<number, Llegada>,
  pendientes: ColaPrioridad,
): void {
  if (nuevoCosto < (costos.get(nodo) ?? Infinity)) {
    costos.set(nodo, nuevoCosto);
    llegadas.set(nodo, llegada);
    pendientes.agregar(nodo, nuevoCosto);
  }
}

// Va hacia atras desde el nodo de salida siguiendo de donde llego cada nodo hasta el nodo de entrada
function reconstruir(llegadas: Map<number, Llegada>): CaminoMinimo {
  let actual = (llegadas.get(DESTINO_FINAL) as Llegada).desde;
  const nodos = [actual];
  const aristas: Arista[] = [];
  for (let llegada = llegadas.get(actual); llegada !== undefined; llegada = llegadas.get(actual)) {
    aristas.push(llegada.arista as Arista);
    nodos.push(llegada.desde);
    actual = llegada.desde;
  }
  return { nodos: nodos.reverse(), aristas: aristas.reverse() };
}
