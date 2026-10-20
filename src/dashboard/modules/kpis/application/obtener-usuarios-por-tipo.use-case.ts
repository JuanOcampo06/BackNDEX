import { sumarTotales } from '../domain/calculos';
import { TIPOS_VEHICULO } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ConteoPorTipo, TableroRepositoryPort } from './tablero.repository.port';

export interface UsuariosPorTipo {
  total: number;
  tipos: ConteoPorTipo[];
}

// Usuarios de micromovilidad por tipo de vehiculo
// el selector camaras o app de la grafica se envia como filtro fuente
export class ObtenerUsuariosPorTipoUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<UsuariosPorTipo> {
    const conteos = await this.tablero.contarUsuariosPorTipo(filtros);
    const totalPorTipo = new Map(conteos.map((conteo) => [conteo.tipoVehiculo, conteo.total]));
    // Siempre salen todos los tipos en el mismo orden aunque alguno no tenga datos
    const tipos = TIPOS_VEHICULO.map((tipoVehiculo) => ({ tipoVehiculo, total: totalPorTipo.get(tipoVehiculo) ?? 0 }));
    return { total: sumarTotales(tipos), tipos };
  }
}
