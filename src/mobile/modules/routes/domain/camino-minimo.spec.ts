import { Acceso, caminoMinimo } from './camino-minimo';
import { construirRed } from './red-vial';
import { ViaCiclista } from './via-ciclista';

// Cuadrado de 111 metros de lado: 1 -- 2
//                                 |    |
//                                 4 -- 3
const PUNTOS: Record<number, [number, number]> = {
  1: [4.601, -74.1],
  2: [4.601, -74.099],
  3: [4.6, -74.099],
  4: [4.6, -74.1],
};

function via(id: number, tipo: ViaCiclista['tipo'], nodos: number[]): ViaCiclista {
  return { id, tipo, riesgo: null, nodos, coordenadas: nodos.map((n) => PUNTOS[n]) };
}

// Entrar o salir por un nodo sin que cueste nada llegar a el
const en = (nodo: number, costo = 0): Acceso[] => [{ nodo, costo }];

describe('caminoMinimo', () => {
  const red = construirRed([via(1, 'ciclovia', [1, 2]), via(2, 'ciclovia', [2, 3]), via(3, 'ciclovia', [1, 4]), via(4, 'ciclovia', [4, 3])]);

  it('encuentra el camino de menor costo entre dos nodos', () => {
    // El tramo 1-4 cuesta mucho y por eso el camino de 1 a 3 pasa por el 2
    const camino = caminoMinimo(red, en(1), en(3), (arista) => (arista.hacia === 4 || arista.hacia === 1 ? 1000 : 1));

    expect(camino?.nodos).toEqual([1, 2, 3]);
    expect(camino?.aristas).toHaveLength(2);
  });

  it('cambia de camino cuando cambia el costo', () => {
    const camino = caminoMinimo(red, en(1), en(3), (arista) => (arista.hacia === 2 || arista.hacia === 1 ? 1000 : 1));

    expect(camino?.nodos).toEqual([1, 4, 3]);
  });

  it('el camino de un nodo a si mismo es solo ese nodo', () => {
    expect(caminoMinimo(red, en(2), en(2), () => 1)).toEqual({ nodos: [2], aristas: [] });
  });

  it('devuelve null cuando no hay forma de llegar', () => {
    const separadas = construirRed([
      { id: 1, tipo: 'ciclovia', riesgo: null, nodos: [1, 2], coordenadas: [[4.6, -74.1], [4.601, -74.1]] },
      { id: 2, tipo: 'ciclovia', riesgo: null, nodos: [3, 4], coordenadas: [[4.7, -74.1], [4.701, -74.1]] },
    ]);

    expect(caminoMinimo(separadas, en(1), en(4), () => 1)).toBeNull();
  });

  it('con varias entradas elige la que da el camino total mas barato contando lo que cuesta llegar a ella', () => {
    // Entrar por el 1 cuesta 50 y por el 4 cuesta 1 y el tramo hasta el 3 cuesta 1 por el 4 y 2 por el 1
    const camino = caminoMinimo(red, [...en(1, 50), ...en(4, 1)], en(3), () => 1);

    expect(camino?.nodos).toEqual([4, 3]);
  });

  it('con varias salidas elige la que da el camino total mas barato contando lo que cuesta salir por ella', () => {
    // Salir por el 2 cuesta 100 y por el 4 cuesta 1 y desde el 1 los dos estan a un tramo
    const camino = caminoMinimo(red, en(1), [...en(2, 100), ...en(4, 1)], () => 1);

    expect(camino?.nodos).toEqual([1, 4]);
  });

  it('una entrada cara puede ser mejor si el resto del camino es mucho mas corto', () => {
    // Desde el 1 a la salida 3 hay dos tramos y desde el 2 hay uno y por eso entrar por el 2 aunque cueste 0,5 mas gana
    const camino = caminoMinimo(red, [...en(1, 0), ...en(2, 0.5)], en(3), () => 1);

    expect(camino?.nodos).toEqual([2, 3]);
  });
});
