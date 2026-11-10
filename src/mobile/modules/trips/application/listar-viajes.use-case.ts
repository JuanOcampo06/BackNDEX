import { Viaje } from '../domain/viaje';
import { ViajesRepositoryPort } from './viajes.repository.port';

// Lista los viajes del ciudadano, los mas recientes primero
export class ListarViajesUseCase {
  constructor(private readonly viajes: ViajesRepositoryPort) {}

  execute(usuarioId: number): Promise<Viaje[]> {
    return this.viajes.listar(usuarioId);
  }
}
