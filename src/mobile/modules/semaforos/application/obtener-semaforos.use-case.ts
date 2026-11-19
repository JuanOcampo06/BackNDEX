import { AreaMapa, EsquinasMapa } from '../domain/area-mapa';
import { Semaforo } from '../domain/semaforo';
import { SemaforosRepositoryPort } from './semaforos.repository.port';

export interface SemaforosEnArea {
  total: number;
  semaforos: Semaforo[];
}

// Semaforos de la parte del mapa que se ve para que la app solo tenga que dibujarlos
export class ObtenerSemaforosUseCase {
  constructor(private readonly semaforos: SemaforosRepositoryPort) {}

  async execute(esquinas: EsquinasMapa): Promise<SemaforosEnArea> {
    const semaforos = await this.semaforos.buscarEnArea(new AreaMapa(esquinas));
    return { total: semaforos.length, semaforos };
  }
}
