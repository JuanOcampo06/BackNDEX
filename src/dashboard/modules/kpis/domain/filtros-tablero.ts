import { Fuente, TipoVehiculo } from './catalogos';
import { Periodo } from './periodo';

// Filtros de la barra superior del tablero
// el vehiculo solo aplica a siniestros y usuarios
// la fuente decide que graficas traen datos y sin fuente o con las dos salen todas combinadas
// localidad vehiculo y fuente son listas y un registro entra si coincide con cualquiera de sus valores
export interface FiltrosTablero {
  periodo: Periodo;
  localidadId?: number[];
  tipoVehiculo?: TipoVehiculo[];
  fuente?: Fuente[];
}

// Una cifra solo se calcula si su fuente esta elegida en el filtro o si no se eligio ninguna
export function incluyeFuente(filtros: FiltrosTablero, fuente: Fuente): boolean {
  return filtros.fuente === undefined || filtros.fuente.includes(fuente);
}
