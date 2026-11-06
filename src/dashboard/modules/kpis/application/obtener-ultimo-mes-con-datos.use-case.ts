import { Fuente, FUENTES } from '../domain/catalogos';
import { TableroRepositoryPort } from './tablero.repository.port';

// Ultimo mes AAAA-MM que tiene datos en las fuentes elegidas
// el tablero lo usa como mes final cuando el frontend no manda meses asi siempre abre con datos
// devuelve undefined si todavia no hay datos y entonces se usa el mes de hoy
export class ObtenerUltimoMesConDatosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(fuentes: readonly Fuente[] = FUENTES): Promise<string | undefined> {
    return (await this.tablero.buscarUltimoMesConDatos(fuentes)) ?? undefined;
  }
}
