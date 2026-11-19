import { IndiceSiniestros } from './indice-siniestros';
import { IndiceTramos } from './indice-tramos';
import { elegirMejor, medirRuta } from './medicion';
import { ViaCiclista } from './via-ciclista';

const sinSiniestros = new IndiceSiniestros([]);

// Ciclovia recta de unos 1.100 metros hacia el este
const via = (riesgo: string | null = null, tipo: ViaCiclista['tipo'] = 'ciclovia'): ViaCiclista => ({
  id: 1,
  tipo,
  riesgo,
  nodos: [1, 2],
  coordenadas: [
    [4.6, -74.1],
    [4.6, -74.09],
  ],
});

const sobreLaVia = [
  { latitud: 4.6, longitud: -74.1 },
  { latitud: 4.6, longitud: -74.09 },
];
// Paralela a unos 110 metros al norte
const aLoLejos = [
  { latitud: 4.601, longitud: -74.1 },
  { latitud: 4.601, longitud: -74.09 },
];

describe('IndiceTramos', () => {
  const indice = new IndiceTramos([via('alto')]);

  it('encuentra la ciclovia que pasa a menos del radio y su riesgo', () => {
    expect(indice.cercana({ latitud: 4.60005, longitud: -74.095 }, 25)).toEqual({ tipo: 'ciclovia', riesgo: 'alto' });
  });

  it('no encuentra nada si la ciclovia esta mas lejos que el radio', () => {
    expect(indice.cercana({ latitud: 4.601, longitud: -74.095 }, 25)).toBeNull();
  });

  it('no encuentra nada pasado el final del tramo', () => {
    expect(indice.cercana({ latitud: 4.6, longitud: -74.0885 }, 25)).toBeNull();
  });
});

describe('medirRuta', () => {
  it('un camino sobre la ciclovia queda medido como ciclovia y el riesgo sale de los siniestros y no de la ciclovia', () => {
    const { tramos } = medirRuta(sobreLaVia, new IndiceTramos([via('medio')]), sinSiniestros);

    expect(tramos.every((tramo) => tramo.tipo === 'ciclovia' && tramo.riesgo === null && tramo.siniestrosCerca === 0)).toBe(true);
    expect(tramos.reduce((total, tramo) => total + tramo.distanciaM, 0)).toBeGreaterThan(1090);
  });

  it('un camino lejos de la ciclovia queda medido como calle normal sin riesgo', () => {
    const { tramos } = medirRuta(aLoLejos, new IndiceTramos([via('alto')]), sinSiniestros);

    expect(tramos.every((tramo) => tramo.tipo === 'conexion' && tramo.riesgo === null)).toBe(true);
  });

  it('cada trozo cuenta los siniestros que hubo a 60 metros o menos, vaya por ciclovia o por calle', () => {
    // Un siniestro con bicicleta (pesa 2) junto a la mitad de la calle lejana y otro a 200 metros de ella
    const siniestros = new IndiceSiniestros([
      { latitud: 4.6012, longitud: -74.095, conBicicleta: true, conMuertos: false },
      { latitud: 4.603, longitud: -74.095, conBicicleta: false, conMuertos: false },
    ]);

    const { tramos } = medirRuta(aLoLejos, new IndiceTramos([via()]), siniestros);
    const conSiniestros = tramos.filter((tramo) => (tramo.siniestrosCerca ?? 0) > 0);

    expect(conSiniestros.length).toBeGreaterThan(0);
    expect(conSiniestros.every((tramo) => tramo.siniestrosCerca === 2)).toBe(true);
    // Solo los trozos cerca de la mitad de la calle los tienen
    expect(conSiniestros.length).toBeLessThan(tramos.length / 5);
  });

  it('un cruce de OpenStreetMap queda medido como cruce', () => {
    const { tramos } = medirRuta(sobreLaVia, new IndiceTramos([via(null, 'cruce')]), sinSiniestros);

    expect(tramos.every((tramo) => tramo.tipo === 'cruce')).toBe(true);
  });
});

describe('elegirMejor', () => {
  const indice = new IndiceTramos([via()]);
  const pegada = medirRuta(sobreLaVia, indice, sinSiniestros);
  const lejana = medirRuta(aLoLejos, indice, sinSiniestros);

  it('la segura elige el camino por ciclovia y con empate gana el primero', () => {
    expect(elegirMejor('segura', [lejana, pegada])).toBe(pegada);
    expect(elegirMejor('segura', [lejana, lejana])).toBe(lejana);
  });
});
