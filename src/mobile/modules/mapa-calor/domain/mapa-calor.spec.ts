import { armarMapaDeCalor, RADIO_MANCHA_M, SiniestroDelAnuario } from './mapa-calor';

const siniestro = (latitud: number, longitud: number, conBicicleta = false): SiniestroDelAnuario => ({
  latitud,
  longitud,
  conBicicleta,
  conMuertos: false,
});

describe('armarMapaDeCalor', () => {
  it('junta en una mancha los siniestros del mismo cuadro y la pone en su centro', () => {
    const puntos = armarMapaDeCalor([siniestro(4.6001, -74.0801), siniestro(4.6003, -74.0803), siniestro(4.6002, -74.0802)], []);

    expect(puntos).toHaveLength(1);
    expect(puntos[0]).toEqual({ latitud: 4.6002, longitud: -74.0802, peso: 1, radioM: RADIO_MANCHA_M });
  });

  it('no dibuja cuadros con muy poco peso', () => {
    expect(armarMapaDeCalor([siniestro(4.6001, -74.0801)], [])).toEqual([]);
  });

  it('el cuadro mas cargado pesa 1 y los demas en proporcion', () => {
    const cargado = Array.from({ length: 20 }, () => siniestro(4.6001, -74.0801));
    const suave = Array.from({ length: 4 }, () => siniestro(4.7001, -74.0501));

    const [primero, segundo] = armarMapaDeCalor([...cargado, ...suave], []);

    expect(primero.peso).toBe(1);
    expect(segundo.peso).toBe(0.2);
  });

  it('suma los reportes de ciudadanos que son un peligro y no los demas', () => {
    const accidente = { latitud: 4.6001, longitud: -74.0801, subcategoria: 'accidente' };
    const policia = { latitud: 4.7001, longitud: -74.0501, subcategoria: 'policia' };

    const puntos = armarMapaDeCalor([], [accidente, policia, policia, policia, policia]);

    expect(puntos).toHaveLength(1);
    expect(puntos[0].latitud).toBeCloseTo(4.6001);
  });

  it('un siniestro con bicicleta pesa el doble', () => {
    expect(armarMapaDeCalor([siniestro(4.6001, -74.0801, true)], [])).toEqual([]);
    expect(armarMapaDeCalor([siniestro(4.6001, -74.0801, true), siniestro(4.6001, -74.0801)], [])).toHaveLength(1);
  });
});
