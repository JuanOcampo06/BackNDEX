import { ActivacionSos } from '../domain/activacion-sos';
import { FiltrosSos, SosRepositoryPort } from './sos.repository.port';

// Lista las activaciones mas recientes primero y se puede filtrar por ciudadano y por estado
export class ListarSosUseCase {
  constructor(private readonly sos: SosRepositoryPort) {}

  execute(filtros: FiltrosSos): Promise<ActivacionSos[]> {
    return this.sos.listar(filtros);
  }
}
