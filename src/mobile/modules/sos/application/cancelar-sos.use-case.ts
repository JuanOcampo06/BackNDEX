import { ActivacionSos, validarCancelacion } from '../domain/activacion-sos';
import { SosNoEncontradoError } from '../domain/sos-no-encontrado.error';
import { SosRepositoryPort } from './sos.repository.port';

// El ciudadano se arrepiente y cancela la activacion
export class CancelarSosUseCase {
  constructor(private readonly sos: SosRepositoryPort) {}

  async execute(id: number): Promise<ActivacionSos> {
    const activacion = await this.sos.buscarPorId(id);
    if (activacion === null) {
      throw new SosNoEncontradoError(id);
    }
    validarCancelacion(activacion);
    return this.sos.cambiarEstado(id, 'cancelada');
  }
}
