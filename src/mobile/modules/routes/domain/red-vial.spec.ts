import { construirRed, nodosDeAcceso } from './red-vial';
import { ViaCiclista } from './via-ciclista';

// Una via de prueba: los puntos que comparten coordenadas comparten nodo, como en OpenStreetMap
function crearConstructorDeVias(): (id: number, tipo: ViaCiclista['tipo'], riesgo: string | null, puntos: [number, number][]) => ViaCiclista {
  const idsPorPunto = new Map<string, number>();
  return (id, tipo, riesgo, puntos) => ({
    id,
    tipo,
    riesgo,
    nodos: puntos.map((punto) => {
      const clave = punto.join(',');
      if (!idsPorPunto.has(clave)) idsPorPunto.set(clave, idsPorPunto.size + 1);
      return idsPorPunto.get(clave) as number;
    }),
    coordenadas: puntos,
  });
}

// Un grado de latitud son unos 111 kilometros y por eso 0,001 son unos 111 metros
const A: [number, number] = [4.6, -74.1];
const B: [number, number] = [4.601, -74.1];
const C: [number, number] = [4.602, -74.1];

describe('construirRed', () => {
  it('conecta los nodos seguidos de cada via en los dos sentidos con su distancia', () => {
    const via = crearConstructorDeVias();

    const red = construirRed([via(1, 'ciclovia', null, [A, B, C])]);

    expect(red.nodos.size).toBe(3);
    const desdeB = red.aristas.get(2) ?? [];
    expect(desdeB.map((arista) => arista.hacia).sort()).toEqual([1, 3]);
    expect(desdeB[0].distanciaM).toBeGreaterThan(110);
    expect(desdeB[0].distanciaM).toBeLessThan(112);
    expect(desdeB.every((arista) => arista.tipo === 'ciclovia')).toBe(true);
  });

  it('une dos vias que comparten un nodo', () => {
    const via = crearConstructorDeVias();

    const red = construirRed([via(1, 'ciclovia', null, [A, B]), via(2, 'cruce', null, [B, C])]);

    expect((red.aristas.get(2) ?? []).map((arista) => arista.tipo).sort()).toEqual(['ciclovia', 'cruce']);
  });

  it('ignora una via cuyos nodos y coordenadas no coinciden', () => {
    const rota: ViaCiclista = { id: 9, tipo: 'ciclovia', riesgo: null, nodos: [1, 2, 3], coordenadas: [A, B] };

    expect(construirRed([rota]).nodos.size).toBe(0);
  });

  it('hayRiesgo es true solo si alguna via trae un riesgo valido', () => {
    const via = crearConstructorDeVias();

    expect(construirRed([via(1, 'ciclovia', null, [A, B])]).hayRiesgo).toBe(false);
    expect(construirRed([via(1, 'ciclovia', 'extremo', [A, B])]).hayRiesgo).toBe(false);
    expect(construirRed([via(1, 'ciclovia', 'alto', [A, B])]).hayRiesgo).toBe(true);
  });

  it('une con un tramo de conexion dos grupos de ciclovias separados por una calle cercana', () => {
    const via = crearConstructorDeVias();
    // Los dos tramos quedan a unos 110 metros uno del otro y sin ningun nodo en comun
    const red = construirRed([via(1, 'ciclovia', null, [A, B]), via(2, 'ciclovia', null, [C, [4.603, -74.1]])]);

    const conexiones = [...red.aristas.values()].flat().filter((arista) => arista.tipo === 'conexion');
    expect(conexiones).toHaveLength(2);
    expect(conexiones[0].riesgo).toBeNull();
  });

  it('no une grupos que estan demasiado lejos', () => {
    const via = crearConstructorDeVias();
    // Medio kilometro entre un grupo y el otro
    const red = construirRed([via(1, 'ciclovia', null, [A, B]), via(2, 'ciclovia', null, [[4.61, -74.1], [4.611, -74.1]])]);

    expect([...red.aristas.values()].flat().some((arista) => arista.tipo === 'conexion')).toBe(false);
  });

  it('no repite enlaces entre grupos que ya quedaron unidos', () => {
    const via = crearConstructorDeVias();
    // Tres tramos paralelos y muy cercanos: bastan dos enlaces largos para juntarlos y los cortos se unen siempre
    const red = construirRed([
      via(1, 'ciclovia', null, [[4.6, -74.1], [4.6, -74.099]]),
      via(2, 'ciclovia', null, [[4.6003, -74.1], [4.6003, -74.099]]),
    ]);

    const conexiones = [...red.aristas.values()].flat().filter((arista) => arista.tipo === 'conexion');
    expect(conexiones.length).toBeGreaterThanOrEqual(2);
    expect(conexiones.every((arista) => arista.distanciaM < 40)).toBe(true);
  });
});

describe('nodosDeAcceso', () => {
  it('devuelve el nodo mas cercano primero y despues los que estan hasta 100 metros mas lejos que el', () => {
    const via = crearConstructorDeVias();
    const red = construirRed([via(1, 'ciclovia', null, [A, B, C])]);

    // Esta a unos 22 metros de B, a 89 de C y a 133 de A y por eso A queda fuera del margen
    const accesos = nodosDeAcceso(red, { latitud: 4.6012, longitud: -74.1 }, 200);

    expect(accesos.map((acceso) => acceso.nodo.id)).toEqual([2, 3]);
    expect(accesos[0].distanciaM).toBeGreaterThan(20);
    expect(accesos[0].distanciaM).toBeLessThan(24);
  });

  it('devuelve una lista vacia si ningun nodo esta dentro del alcance', () => {
    const via = crearConstructorDeVias();
    const red = construirRed([via(1, 'ciclovia', null, [A, B, C])]);

    expect(nodosDeAcceso(red, { latitud: 4.7, longitud: -74.1 }, 600)).toEqual([]);
  });

  it('nunca devuelve mas de 12 nodos aunque haya muchos juntos', () => {
    const via = crearConstructorDeVias();
    const apretados: [number, number][] = Array.from({ length: 30 }, (_, i) => [4.6 + i * 0.00001, -74.1]);
    const red = construirRed([via(1, 'ciclovia', null, apretados)]);

    expect(nodosDeAcceso(red, { latitud: 4.6001, longitud: -74.1 }, 200)).toHaveLength(12);
  });
});
