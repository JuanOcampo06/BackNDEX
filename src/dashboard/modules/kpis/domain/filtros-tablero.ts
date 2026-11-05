import { Fuente, TipoVehiculo } from './catalogos';
import { Periodo } from './periodo';

// Filtros de la barra superior del tablero
// el vehiculo solo aplica a siniestros y usuarios y la fuente solo a usuarios
// localidad vehiculo y fuente son listas y un registro entra si coincide con cualquiera de sus valores
export interface FiltrosTablero {
  periodo: Periodo;
  localidadId?: number[];
  tipoVehiculo?: TipoVehiculo[];
  fuente?: Fuente[];
}
