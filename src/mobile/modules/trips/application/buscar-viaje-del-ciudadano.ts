import { ViajeConPuntos } from '../domain/viaje';
import { ViajeNoEncontradoError } from '../domain/viaje-no-encontrado.error';
import { ViajesRepositoryPort } from './viajes.repository.port';

// Busca un viaje y exige que sea del ciudadano
// el viaje de otra persona responde igual que uno que no existe para no revelar que existe
export async function buscarViajeDelCiudadano(viajes: ViajesRepositoryPort, id: number, usuarioId: number): Promise<ViajeConPuntos> {
  const viaje = await viajes.buscarPorId(id);
  if (viaje === null || viaje.usuarioId !== usuarioId) {
    throw new ViajeNoEncontradoError(id);
  }
  return viaje;
}
