import { coordenadasValidas } from '../../../../shared/coordenadas';
import { EstadoViaje } from './catalogos';
import { ViajeInvalidoError } from './viaje-invalido.error';

// Viaje ya guardado: el id, el estado y las fechas los pone la base de datos
// la distancia son los metros recorridos y se calcula al finalizar
export interface Viaje {
  id: number;
  usuarioId: number;
  estado: EstadoViaje;
  distanciaM: number;
  iniciadoEn: string;
  finalizadoEn: string | null;
}

// Un punto GPS del recorrido
export interface PuntoViaje {
  latitud: number;
  longitud: number;
  registradoEn: string;
}

// El viaje con todo su recorrido en el orden en que se registro
export interface ViajeConPuntos extends Viaje {
  puntos: PuntoViaje[];
}

// Una ubicacion GPS sin revisar
export type Ubicacion = Pick<PuntoViaje, 'latitud' | 'longitud'>;

// Lo que se necesita para iniciar un viaje: quien lo hace y desde donde sale
export type NuevoViaje = Ubicacion & Pick<Viaje, 'usuarioId'>;

// Aplica las reglas del negocio y devuelve el viaje listo para guardar
export function crearNuevoViaje(datos: NuevoViaje): NuevoViaje {
  return { usuarioId: datos.usuarioId, ...validarUbicacion(datos) };
}

// Revisa que la ubicacion sea real y devuelve solo latitud y longitud
export function validarUbicacion(datos: Ubicacion): Ubicacion {
  if (!coordenadasValidas(datos.latitud, datos.longitud)) {
    throw new ViajeInvalidoError('La ubicacion no es valida');
  }
  return { latitud: datos.latitud, longitud: datos.longitud };
}

// Regla de negocio: solo se puede agregar puntos o finalizar un viaje que sigue en curso
export function validarEnCurso(viaje: Viaje): void {
  if (viaje.estado !== 'en_curso') {
    throw new ViajeInvalidoError(`El viaje ${viaje.id} ya esta ${viaje.estado}`);
  }
}
