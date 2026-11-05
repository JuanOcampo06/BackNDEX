import { TipoVehiculo } from './catalogos';
import { Periodo } from './periodo';

// Filtros de la barra superior del tablero
// el vehiculo solo aplica a siniestros y usuarios
// localidad y vehiculo son listas y un registro entra si coincide con cualquiera de sus valores
export interface FiltrosTablero {
  periodo: Periodo;
  localidadId?: number[];
  tipoVehiculo?: TipoVehiculo[];
}
