import { AreaMapa } from '../domain/area-mapa';
import { Ciclovia, TipoCiclovia } from '../domain/ciclovia';
import { CicloviaRepositoryPort } from './ciclovia.repository.port';

export interface ObtenerCicloviasCommand {
  area: AreaMapa;
  tipo?: TipoCiclovia;
}

export interface CicloviasEnArea {
  total: number;
  ciclovias: Ciclovia[];
}

// Ciclovias de la parte del mapa que se ve para no mandar la ciudad completa en cada peticion
export class ObtenerCicloviasUseCase {
  constructor(private readonly ciclovias: CicloviaRepositoryPort) {}

  async execute(comando: ObtenerCicloviasCommand): Promise<CicloviasEnArea> {
    const ciclovias = await this.ciclovias.buscarEnArea(comando.area, comando.tipo);
    return { total: ciclovias.length, ciclovias };
  }
}
