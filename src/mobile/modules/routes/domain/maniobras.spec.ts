import { calcularPasos } from './maniobras';

// 0,001 grados de latitud son unos 111 metros y 0,001 de longitud cerca de Bogota son unos 111 metros
const punto = (latitud: number, longitud: number) => ({ latitud, longitud });

describe('calcularPasos', () => {
  it('una ruta recta solo tiene salida y llegada', () => {
    const pasos = calcularPasos([punto(4.6, -74.1), punto(4.601, -74.1), punto(4.602, -74.1)]);

    expect(pasos.map((paso) => paso.tipo)).toEqual(['salida', 'llegada']);
    expect(pasos[0].distanciaDesdeInicioM).toBe(0);
    expect(pasos[1].distanciaDesdeInicioM).toBeGreaterThan(220);
  });

  it('marca un giro a la derecha en la esquina con la distancia hasta ella', () => {
    // Va al norte y luego al este
    const pasos = calcularPasos([punto(4.6, -74.1), punto(4.601, -74.1), punto(4.602, -74.1), punto(4.602, -74.099), punto(4.602, -74.098)]);

    expect(pasos.map((paso) => paso.tipo)).toEqual(['salida', 'derecha', 'llegada']);
    expect(pasos[1]).toMatchObject({ latitud: 4.602, longitud: -74.1 });
    expect(pasos[1].distanciaDesdeInicioM).toBeGreaterThan(220);
    expect(pasos[1].distanciaDesdeInicioM).toBeLessThan(224);
  });

  it('marca un giro a la izquierda', () => {
    // Va al norte y luego al oeste
    const pasos = calcularPasos([punto(4.6, -74.1), punto(4.601, -74.1), punto(4.602, -74.1), punto(4.602, -74.101), punto(4.602, -74.102)]);

    expect(pasos.map((paso) => paso.tipo)).toEqual(['salida', 'izquierda', 'llegada']);
  });

  it('marca devolverse como giro en u', () => {
    const pasos = calcularPasos([punto(4.6, -74.1), punto(4.601, -74.1), punto(4.602, -74.1), punto(4.601, -74.1), punto(4.6, -74.1)]);

    expect(pasos.map((paso) => paso.tipo)).toEqual(['salida', 'giro_en_u', 'llegada']);
  });

  it('una curva suave hecha de muchos puntos juntos no cuenta como giro', () => {
    // Un cuarto de circunferencia de unos 200 metros de radio repartido en puntos cada pocos metros
    const curva = Array.from({ length: 60 }, (_, i) => {
      const angulo = (i / 59) * (Math.PI / 2);
      return punto(4.6 + (Math.sin(angulo) * 200) / 111000, -74.1 + ((1 - Math.cos(angulo)) * 200) / 111000);
    });

    expect(calcularPasos(curva).map((paso) => paso.tipo)).toEqual(['salida', 'llegada']);
  });

  it('una esquina marcada con varios puntos muy juntos cuenta como un solo giro', () => {
    const pasos = calcularPasos([
      punto(4.6, -74.1),
      punto(4.601, -74.1),
      punto(4.6019, -74.1),
      punto(4.60195, -74.10002),
      punto(4.602, -74.10008),
      punto(4.602, -74.099),
      punto(4.602, -74.098),
    ]);

    expect(pasos.filter((paso) => paso.tipo === 'derecha')).toHaveLength(1);
  });

  it('sin al menos dos puntos no hay pasos', () => {
    expect(calcularPasos([])).toEqual([]);
    expect(calcularPasos([punto(4.6, -74.1)])).toEqual([]);
  });
});
