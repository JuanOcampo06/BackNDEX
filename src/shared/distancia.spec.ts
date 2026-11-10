import { distanciaEntre } from './distancia';

describe('distanciaEntre', () => {
  it('un grado de latitud son unos 111 kilometros', () => {
    const metros = distanciaEntre({ latitud: 4, longitud: -74 }, { latitud: 5, longitud: -74 });

    expect(metros).toBeGreaterThan(111_000);
    expect(metros).toBeLessThan(111_400);
  });

  it('el mismo punto esta a cero metros', () => {
    expect(distanciaEntre({ latitud: 4.65, longitud: -74.08 }, { latitud: 4.65, longitud: -74.08 })).toBe(0);
  });

  it('da lo mismo en un sentido que en el otro', () => {
    const a = { latitud: 4.6, longitud: -74.1 };
    const b = { latitud: 4.7, longitud: -74.0 };

    expect(distanciaEntre(a, b)).toBeCloseTo(distanciaEntre(b, a), 6);
  });
});
