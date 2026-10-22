import { AreaMapa } from '../domain/area-mapa';
import { Ciclovia, TipoCiclovia } from '../domain/ciclovia';
import { CicloviaRepositoryPort } from './ciclovia.repository.port';
import { ObtenerCicloviasUseCase } from './obtener-ciclovias.use-case';

// Repositorio falso que guarda lo que le piden para revisarlo en la prueba
class FakeCicloviaRepository implements CicloviaRepositoryPort {
  pedido?: { area: AreaMapa; tipo?: TipoCiclovia };

  constructor(private readonly ciclovias: Ciclovia[]) {}

  async buscarEnArea(area: AreaMapa, tipo?: TipoCiclovia): Promise<Ciclovia[]> {
    this.pedido = { area, tipo };
    return this.ciclovias;
  }
}

describe('ObtenerCicloviasUseCase', () => {
  const area = new AreaMapa({ minLat: 4.6, minLon: -74.15, maxLat: 4.7, maxLon: -74.05 });
  const cruce: Ciclovia = {
    id: 24437178,
    tipo: 'cruce',
    nombre: null,
    riesgo: null,
    nodos: [265596896, 12596010822],
    coordenadas: [
      [4.6729127, -74.0539053],
      [4.6728981, -74.0538459],
    ],
  };

  it('pide las ciclovias del area con el tipo y devuelve el total', async () => {
    const repositorio = new FakeCicloviaRepository([cruce]);

    const resultado = await new ObtenerCicloviasUseCase(repositorio).execute({ area, tipo: 'cruce' });

    expect(repositorio.pedido).toEqual({ area, tipo: 'cruce' });
    expect(resultado).toEqual({ total: 1, ciclovias: [cruce] });
  });
});
