import { coordenadasValidas } from '../../../../shared/coordenadas';
import { esTipoVehiculo, TipoVehiculo } from '../../../../shared/tipos-vehiculo';
import { EstadoViaje } from './catalogos';
import { ViajeInvalidoError } from './viaje-invalido.error';

// Viaje ya guardado: el id, el estado y la fecha de inicio los pone la base de datos
// la distancia (metros), la duracion (segundos) y la cantidad de reportes se calculan al finalizar
// la duracion y la fecha de fin son null mientras el viaje sigue en curso
export interface Viaje {
  id: number;
  usuarioId: number;
  tipoVehiculo: TipoVehiculo;
  estado: EstadoViaje;
  distanciaM: number;
  duracionS: number | null;
  cantidadReportes: number;
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

// Lo que se necesita para iniciar un viaje: quien lo hace, en que vehiculo y desde donde sale
export type NuevoViaje = Ubicacion & Pick<Viaje, 'usuarioId' | 'tipoVehiculo'>;

// Datos tal como llegan desde afuera con el vehiculo todavia sin revisar
export type DatosViaje = Omit<NuevoViaje, 'tipoVehiculo'> & { tipoVehiculo: string };

// Lo que se guarda al finalizar el viaje
export interface ResultadoViaje {
  finalizadoEn: string;
  distanciaM: number;
  duracionS: number;
  cantidadReportes: number;
}

// Aplica las reglas del negocio y devuelve el viaje listo para guardar
export function crearNuevoViaje(datos: DatosViaje): NuevoViaje {
  if (!esTipoVehiculo(datos.tipoVehiculo)) {
    throw new ViajeInvalidoError(`El tipo de vehiculo ${datos.tipoVehiculo} no existe`);
  }
  return { usuarioId: datos.usuarioId, tipoVehiculo: datos.tipoVehiculo, ...validarUbicacion(datos) };
}

// Segundos entre dos fechas ISO y nunca negativos aunque los relojes de la api y de la base no coincidan al milisegundo
export function duracionEntre(inicio: string, fin: string): number {
  return Math.max(0, Math.round((Date.parse(fin) - Date.parse(inicio)) / 1000));
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
