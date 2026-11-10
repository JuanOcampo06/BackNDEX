import { ViajeConPuntos } from '../domain/viaje';
import { buscarViajeDelCiudadano } from './buscar-viaje-del-ciudadano';
import { ViajesRepositoryPort } from './viajes.repository.port';

// Devuelve un viaje del ciudadano con todo su recorrido o avisa que no existe
export class ObtenerViajeUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  execute(usuarioId: number, viajeId: number): Promise<ViajeConPuntos> {
    return buscarViajeDelCiudadano(this.viajes, viajeId, usuarioId);
  }
}
