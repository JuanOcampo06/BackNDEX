import { FuentesDeCalorPort } from './fuentes-de-calor.port';
import { DIAS_DE_REPORTES, ObtenerMapaCalorUseCase } from './obtener-mapa-calor.use-case';

describe('ObtenerMapaCalorUseCase', () => {
  const ahora = new Date('2026-11-19T12:00:00Z');

  it('junta siniestros y reportes recientes y devuelve el total', async () => {
    let pedidosDesde: Date | null = null;
    const fuentes: FuentesDeCalorPort = {
      siniestros: async () => [
        { latitud: 4.6001, longitud: -74.0801, conBicicleta: true, conMuertos: false },
        { latitud: 4.6002, longitud: -74.0802, conBicicleta: false, conMuertos: false },
      ],
      reportesDesde: async (desde) => {
        pedidosDesde = desde;
        return [{ latitud: 4.6003, longitud: -74.0803, subcategoria: 'robo' }];
      },
    };

    const resultado = await new ObtenerMapaCalorUseCase(fuentes, () => ahora).execute();

    expect(resultado.total).toBe(1);
    expect(resultado.puntos[0].peso).toBe(1);
    expect(pedidosDesde).toEqual(new Date(ahora.getTime() - DIAS_DE_REPORTES * 86_400_000));
  });

  it('sin datos devuelve el mapa vacio', async () => {
    const fuentes: FuentesDeCalorPort = { siniestros: async () => [], reportesDesde: async () => [] };

    expect(await new ObtenerMapaCalorUseCase(fuentes, () => ahora).execute()).toEqual({ total: 0, puntos: [] });
  });
});
