import { Fuente, FUENTES, TIPOS_VEHICULO, TipoVehiculo } from '../domain/catalogos';
import { Localidad, TableroRepositoryPort } from './tablero.repository.port';

export interface FiltrosDisponibles {
  localidades: Localidad[];
  tiposVehiculo: readonly TipoVehiculo[];
  fuentes: readonly Fuente[];
}

// Opciones para llenar los selectores de la barra de filtros
export class ObtenerFiltrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(): Promise<FiltrosDisponibles> {
    const localidades = await this.tablero.listarLocalidades();
    return { localidades, tiposVehiculo: TIPOS_VEHICULO, fuentes: FUENTES };
  }
}
