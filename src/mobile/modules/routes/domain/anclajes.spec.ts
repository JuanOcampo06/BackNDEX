import { anclajesDe, anclajesSegurosDe } from './anclajes';
import { IndiceSiniestros } from './indice-siniestros';
import { IndiceTramos } from './indice-tramos';
import { ViaCiclista } from './via-ciclista';

// Camino recto de unos 4,4 km hacia el este
const camino = [
  { latitud: 4.6, longitud: -74.1 },
  { latitud: 4.6, longitud: -74.06 },
];

const cicloviaAlNorte = (riesgo: string | null): ViaCiclista => ({
  id: 1,
  tipo: 'ciclovia',
  riesgo,
  nodos: [1, 2],
  coordenadas: [
    [4.6025, -74.1],
    [4.6025, -74.06],
  ],
});

describe('anclajesDe', () => {
  it('propone puntos sobre una ciclovia cercana al camino', () => {
    const juegos = anclajesDe(camino, new IndiceTramos([cicloviaAlNorte('bajo')]));

    expect(juegos.length).toBeGreaterThan(0);
    expect(juegos.flat().every((punto) => Math.abs(punto.latitud - 4.6025) < 1e-6)).toBe(true);
  });

  it('no propone ciclovias de riesgo alto ni ciclovias lejanas', () => {
    const lejana: ViaCiclista = { ...cicloviaAlNorte('bajo'), coordenadas: [[4.62, -74.1], [4.62, -74.06]] };

    expect(anclajesDe(camino, new IndiceTramos([cicloviaAlNorte('alto')]))).toEqual([]);
    expect(anclajesDe(camino, new IndiceTramos([lejana]))).toEqual([]);
  });
});

describe('anclajesSegurosDe', () => {
  // Muchos siniestros justo en la mitad del camino
  const enElCamino = Array.from({ length: 6 }, () => ({ latitud: 4.6, longitud: -74.08, conBicicleta: false, conMuertos: false }));

  it('propone hasta dos calles paralelas con menos siniestros que el camino', () => {
    const juegos = anclajesSegurosDe(camino, new IndiceSiniestros(enElCamino));

    expect(juegos).toHaveLength(2);
    // Son puntos a un lado del camino, cerca de su mitad
    for (const [punto] of juegos) {
      expect(Math.abs(punto.latitud - 4.6)).toBeGreaterThan(0.002);
      expect(Math.abs(punto.longitud + 74.08)).toBeLessThan(0.0005);
    }
  });

  it('prefiere el lado sin siniestros', () => {
    // Al norte hay todavia mas siniestros que en el camino, al sur ninguno
    const alNorte = Array.from({ length: 9 }, () => ({ latitud: 4.6045, longitud: -74.08, conBicicleta: false, conMuertos: false }));

    const juegos = anclajesSegurosDe(camino, new IndiceSiniestros([...enElCamino, ...alNorte]));

    expect(juegos.length).toBeGreaterThan(0);
    expect(juegos.every(([punto]) => punto.latitud < 4.6)).toBe(true);
  });

  it('no propone nada si el camino no pasa junto a siniestros', () => {
    expect(anclajesSegurosDe(camino, new IndiceSiniestros([]))).toEqual([]);
  });
});
