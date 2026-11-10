import { distanciaEntre } from '../../../../shared/distancia';
import { distanciaRecorrida } from './distancia';

describe('distanciaRecorrida', () => {
  it('suma los tramos del recorrido en orden', () => {
    const a = { latitud: 4.65, longitud: -74.08 };
    const b = { latitud: 4.66, longitud: -74.08 };
    const c = { latitud: 4.66, longitud: -74.07 };

    expect(distanciaRecorrida([a, b, c])).toBeCloseTo(distanciaEntre(a, b) + distanciaEntre(b, c), 0);
  });

  it('un recorrido con menos de dos puntos no tiene distancia', () => {
    expect(distanciaRecorrida([])).toBe(0);
    expect(distanciaRecorrida([{ latitud: 4.65, longitud: -74.08 }])).toBe(0);
  });
});
