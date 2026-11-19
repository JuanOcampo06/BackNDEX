import { Fuente, FUENTES, TIPOS_VEHICULO, TipoVehiculo } from '../domain/catalogos';
import { Localidad, RangoDeMeses, TableroRepositoryPort } from './tablero.repository.port';

export interface FiltrosDisponibles {
  localidades: Localidad[];
  tiposVehiculo: readonly TipoVehiculo[];
  fuentes: readonly Fuente[];
  primerMes: string | null;
  ultimoMes: string | null;
  periodos: Record<Fuente, RangoDeMeses>;
}

// Opciones para llenar los selectores de la barra de filtros
// primer y ultimo mes son AAAA-MM del rango con datos de todas las fuentes y null si todavia no hay datos
// periodos trae ese mismo rango para cada fuente por separado
export class ObtenerFiltrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(): Promise<FiltrosDisponibles> {
    const [localidades, rango, anuario, app] = await Promise.all([
      this.tablero.listarLocalidades(),
      this.tablero.buscarRangoDeMeses(FUENTES),
      this.tablero.buscarRangoDeMeses(['anuario']),
      this.tablero.buscarRangoDeMeses(['app']),
    ]);
    return { localidades, tiposVehiculo: TIPOS_VEHICULO, fuentes: FUENTES, ...rango, periodos: { anuario, app } };
  }
}
