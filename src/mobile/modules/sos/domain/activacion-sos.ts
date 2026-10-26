import { coordenadasValidas } from '../../../../shared/coordenadas';
import { EstadoSos } from './catalogos';
import { SosInvalidoError } from './sos-invalido.error';

// Activacion ya guardada: el id, el estado y la fecha los pone la base de datos
export interface ActivacionSos {
  id: number;
  usuarioId: number;
  latitud: number;
  longitud: number;
  estado: EstadoSos;
  activadoEn: string;
}

// Lo que se necesita para activar el boton
export type NuevaActivacionSos = Pick<ActivacionSos, 'usuarioId' | 'latitud' | 'longitud'>;

// Aplica las reglas del negocio y devuelve una activacion lista para guardar
export function crearNuevaActivacion(datos: NuevaActivacionSos): NuevaActivacionSos {
  if (!coordenadasValidas(datos.latitud, datos.longitud)) {
    throw new SosInvalidoError('La ubicacion de la activacion no es valida');
  }
  return { usuarioId: datos.usuarioId, latitud: datos.latitud, longitud: datos.longitud };
}

// Regla de negocio: solo se puede cancelar una activacion que sigue activa
export function validarCancelacion(activacion: ActivacionSos): void {
  if (activacion.estado !== 'activa') {
    throw new SosInvalidoError(`Solo se puede cancelar una activacion activa y esta ${activacion.estado}`);
  }
}
