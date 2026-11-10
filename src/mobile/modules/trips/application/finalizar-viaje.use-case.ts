import { distanciaRecorrida } from '../domain/distancia';
import { validarEnCurso, Viaje } from '../domain/viaje';
import { buscarViajeDelCiudadano } from './buscar-viaje-del-ciudadano';
import { ViajesRepositoryPort } from './viajes.repository.port';

// El ciudadano llega a su destino: se suman los tramos del recorrido y se cierra el viaje
export class FinalizarViajeUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  async execute(usuarioId: number, viajeId: number): Promise<Viaje> {
    const viaje = await buscarViajeDelCiudadano(this.viajes, viajeId, usuarioId);
    validarEnCurso(viaje);
    return this.viajes.finalizar(viajeId, distanciaRecorrida(viaje.puntos));
  }
}
