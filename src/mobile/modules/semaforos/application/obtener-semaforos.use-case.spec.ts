import { Semaforo } from '../domain/semaforo';
import { ObtenerSemaforosUseCase } from './obtener-semaforos.use-case';
import { SemaforosRepositoryPort } from './semaforos.repository.port';

const dentro: Semaforo = { id: 1, latitud: 4.65, longitud: -74.06 };
const fuera: Semaforo = { id: 2, latitud: 4.9, longitud: -74.0 };

// Repositorio en memoria que respeta el rectangulo como lo hace la base de datos
const repositorio: SemaforosRepositoryPort = {
  buscarEnArea: async (area) =>
    [dentro, fuera].filter(
      (s) => s.latitud >= area.minLat && s.latitud <= area.maxLat && s.longitud >= area.minLon && s.longitud <= area.maxLon,
    ),
};

describe('ObtenerSemaforosUseCase', () => {
  const esquinas = { minLat: 4.6, minLon: -74.1, maxLat: 4.7, maxLon: -74.0 };

  it('devuelve solo los semaforos de la zona con su total', async () => {
    const resultado = await new ObtenerSemaforosUseCase(repositorio).execute(esquinas);

    expect(resultado).toEqual({ total: 1, semaforos: [dentro] });
  });

  it('rechaza una zona sin sentido', async () => {
    await expect(new ObtenerSemaforosUseCase(repositorio).execute({ ...esquinas, minLat: 5 })).rejects.toMatchObject({ codigo: 'AREA_INVALIDA' });
  });
});
