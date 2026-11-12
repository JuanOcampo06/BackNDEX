import { Fuente, FUENTES, TIPOS_VEHICULO, TipoVehiculo } from '../domain/catalogos';
import { Localidad, TableroRepositoryPort } from './tablero.repository.port';

export interface FiltrosDisponibles {
  localidades: Localidad[];
  tiposVehiculo: readonly TipoVehiculo[];
  fuentes: readonly Fuente[];
  primerMes: string | null;
  ultimoMes: string | null;
}

// Opciones para llenar los selectores de la barra de filtros
// primer y ultimo mes son AAAA-MM del rango con datos de todas las fuentes y null si todavia no hay datos
export class ObtenerFiltrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(): Promise<FiltrosDisponibles> {
    const [localidades, rango] = await Promise.all([this.tablero.listarLocalidades(), this.tablero.buscarRangoDeMeses(FUENTES)]);
    return { localidades, tiposVehiculo: TIPOS_VEHICULO, fuentes: FUENTES, ...rango };
  }
}
