import { ActivacionSos, validarCancelacion } from '../domain/activacion-sos';
import { SosNoEncontradoError } from '../domain/sos-no-encontrado.error';
import { SosRepositoryPort } from './sos.repository.port';

// El ciudadano se arrepiente y cancela su activacion
// la activacion de otro ciudadano responde igual que una que no existe
export class CancelarSosUseCase {
  constructor(private readonly sos: SosRepositoryPort) {}

  async execute(id: number, usuarioId: number): Promise<ActivacionSos> {
    const activacion = await this.sos.buscarPorId(id);
    if (activacion === null || activacion.usuarioId !== usuarioId) {
      throw new SosNoEncontradoError(id);
    }
    validarCancelacion(activacion);
    return this.sos.cambiarEstado(id, 'cancelada');
  }
}
