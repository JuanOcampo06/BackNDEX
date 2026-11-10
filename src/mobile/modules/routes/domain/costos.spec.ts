import { costoDe, duracionDe } from './costos';

describe('duracionDe', () => {
  it('a 15 km/h en ciclovia tarda 4 minutos en recorrer un kilometro', () => {
    expect(duracionDe('ciclovia', 1000)).toBeCloseTo(240, 0);
  });

  it('en cruce y en calle se va mas despacio que en ciclovia', () => {
    expect(duracionDe('cruce', 1000)).toBeGreaterThan(duracionDe('conexion', 1000));
    expect(duracionDe('conexion', 1000)).toBeGreaterThan(duracionDe('ciclovia', 1000));
  });
});

describe('costoDe', () => {
  const tramo = { distanciaM: 1000, tipo: 'ciclovia' as const, riesgo: null };

  it('la rapida cobra el tiempo del tramo sin mirar el riesgo', () => {
    expect(costoDe('rapida', tramo)).toBeCloseTo(duracionDe('ciclovia', 1000), 6);
    expect(costoDe('rapida', { ...tramo, riesgo: 'alto' })).toBeCloseTo(duracionDe('ciclovia', 1000), 6);
  });

  it('la segura cobra los metros y sin riesgo una ciclovia cuesta lo que mide', () => {
    expect(costoDe('segura', tramo)).toBe(1000);
  });

  it('la segura encarece la calle y el cruce frente a la ciclovia', () => {
    expect(costoDe('segura', { ...tramo, tipo: 'cruce' })).toBeGreaterThan(costoDe('segura', tramo));
    expect(costoDe('segura', { ...tramo, tipo: 'conexion' })).toBeGreaterThan(costoDe('segura', { ...tramo, tipo: 'cruce' }));
  });

  it('la segura encarece mas el riesgo alto que el medio y el medio que el bajo', () => {
    const bajo = costoDe('segura', { ...tramo, riesgo: 'bajo' });
    const medio = costoDe('segura', { ...tramo, riesgo: 'medio' });
    const alto = costoDe('segura', { ...tramo, riesgo: 'alto' });

    expect(bajo).toBe(costoDe('segura', tramo));
    expect(medio).toBeGreaterThan(bajo);
    expect(alto).toBeGreaterThan(medio);
  });

  it('un desvio por ciclovia 40% mas largo que ir por calle lo elige la segura pero no la rapida', () => {
    const porCalle = { distanciaM: 1000, tipo: 'conexion' as const, riesgo: null };
    const desvio = { distanciaM: 1400, tipo: 'ciclovia' as const, riesgo: null };

    expect(costoDe('rapida', porCalle)).toBeLessThan(costoDe('rapida', desvio));
    expect(costoDe('segura', desvio)).toBeLessThan(costoDe('segura', porCalle));
  });

  it('la equilibrada es el promedio entre el costo de la rapida y el de la segura pasado a segundos', () => {
    const tramoCalle = { distanciaM: 1000, tipo: 'conexion' as const, riesgo: null };
    const segundosDeLaSegura = costoDe('segura', tramoCalle) / (15 / 3.6);

    expect(costoDe('equilibrada', tramoCalle)).toBeCloseTo((costoDe('rapida', tramoCalle) + segundosDeLaSegura) / 2, 6);
  });

  it('en una ciclovia sin riesgo las tres rutas cobran lo mismo por metro', () => {
    const tramo = { distanciaM: 1000, tipo: 'ciclovia' as const, riesgo: null };

    expect(costoDe('equilibrada', tramo)).toBeCloseTo(costoDe('rapida', tramo), 6);
    expect(costoDe('segura', tramo) / (15 / 3.6)).toBeCloseTo(costoDe('rapida', tramo), 6);
  });

  it('la equilibrada castiga la calle mas que la rapida y menos que la segura', () => {
    // Cuanto mas cara es la calle frente a la ciclovia, medido en cada criterio
    const razon = (criterio: 'rapida' | 'equilibrada' | 'segura') =>
      costoDe(criterio, { distanciaM: 1000, tipo: 'conexion', riesgo: null }) /
      costoDe(criterio, { distanciaM: 1000, tipo: 'ciclovia', riesgo: null });

    expect(razon('rapida')).toBeLessThan(razon('equilibrada'));
    expect(razon('equilibrada')).toBeLessThan(razon('segura'));
  });

  it('tres desvios distintos por ciclovia: la rapida va por calle, la equilibrada va por calle hasta cierto largo y la segura la evita antes', () => {
    const porCalle = { distanciaM: 1000, tipo: 'conexion' as const, riesgo: null };
    const elige = (criterio: 'rapida' | 'equilibrada' | 'segura', largoDelDesvio: number): 'calle' | 'desvio' =>
      costoDe(criterio, porCalle) <= costoDe(criterio, { distanciaM: largoDelDesvio, tipo: 'ciclovia', riesgo: null }) ? 'calle' : 'desvio';

    // Con un desvio de 1.350 m solo la rapida sigue por la calle
    expect([elige('segura', 1350), elige('equilibrada', 1350), elige('rapida', 1350)]).toEqual(['desvio', 'desvio', 'calle']);
    // Con uno de 1.500 m tambien la equilibrada y solo la segura rodea
    expect([elige('segura', 1500), elige('equilibrada', 1500), elige('rapida', 1500)]).toEqual(['desvio', 'calle', 'calle']);
  });
});
