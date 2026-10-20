import { Fuente, TipoVehiculo } from './catalogos';
import { Periodo } from './periodo';

// Filtros de la barra superior del tablero
// el vehiculo solo aplica a siniestros y usuarios y la fuente solo a usuarios
export interface FiltrosTablero {
  periodo: Periodo;
  localidadId?: number;
  tipoVehiculo?: TipoVehiculo;
  fuente?: Fuente;
}
