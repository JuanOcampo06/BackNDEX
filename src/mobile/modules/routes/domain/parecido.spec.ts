import { mismoCamino } from './parecido';

// Camino recto de unos 1.100 metros hacia el este
const recto = [
  { latitud: 4.6, longitud: -74.1 },
  { latitud: 4.6, longitud: -74.09 },
];

describe('mismoCamino', () => {
  it('dos caminos por la misma calle con puntos distintos son el mismo', () => {
    const conMasPuntos = [
      { latitud: 4.6, longitud: -74.1 },
      { latitud: 4.60005, longitud: -74.097 },
      { latitud: 4.59995, longitud: -74.093 },
      { latitud: 4.6, longitud: -74.09 },
    ];

    expect(mismoCamino(recto, conMasPuntos)).toBe(true);
  });

  it('un camino por una calle paralela a 200 metros es otro camino', () => {
    const paralelo = [
      { latitud: 4.6, longitud: -74.1 },
      { latitud: 4.6018, longitud: -74.099 },
      { latitud: 4.6018, longitud: -74.091 },
      { latitud: 4.6, longitud: -74.09 },
    ];

    expect(mismoCamino(recto, paralelo)).toBe(false);
  });

  it('un camino que sigue la misma calle y luego se va por otra no es el mismo', () => {
    const seDesvia = [
      { latitud: 4.6, longitud: -74.1 },
      { latitud: 4.6, longitud: -74.096 },
      { latitud: 4.603, longitud: -74.093 },
      { latitud: 4.6, longitud: -74.09 },
    ];

    expect(mismoCamino(recto, seDesvia)).toBe(false);
  });
});
