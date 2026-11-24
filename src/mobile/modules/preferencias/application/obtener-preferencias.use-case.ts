import { Preferencias, PREFERENCIAS_POR_DEFECTO } from '../domain/preferencias';
import { PreferenciasRepositoryPort } from './preferencias.repository.port';

// Preferencias guardadas en la cuenta del ciudadano y si nunca guardo nada las de la app por defecto
export class ObtenerPreferenciasUseCase {
  constructor(private readonly preferencias: PreferenciasRepositoryPort) {}

  async execute(usuarioId: number): Promise<Preferencias> {
    return (await this.preferencias.buscar(usuarioId)) ?? PREFERENCIAS_POR_DEFECTO;
  }
}
