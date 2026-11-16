import { NuevoViaje, PuntoViaje, ResultadoViaje, Ubicacion, Viaje, ViajeConPuntos } from '../domain/viaje';

export const VIAJES_REPOSITORY = Symbol('VIAJES_REPOSITORY');

// Puerto que el modulo necesita para guardar y leer viajes sin saber de que base de datos vienen
export interface ViajesRepositoryPort {
  // Devuelve el viaje que el ciudadano tiene abierto o null si no tiene ninguno
  buscarEnCurso(usuarioId: number): Promise<Viaje | null>;
  // Crea el viaje y guarda la salida como su primer punto
  iniciar(viaje: NuevoViaje): Promise<Viaje>;
  buscarPorId(id: number): Promise<ViajeConPuntos | null>;
  agregarPunto(viajeId: number, ubicacion: Ubicacion): Promise<PuntoViaje>;
  finalizar(id: number, resultado: ResultadoViaje): Promise<Viaje>;
  // Cuantos reportes envio el ciudadano entre las dos fechas ISO y los dos extremos cuentan
  contarReportes(usuarioId: number, desde: string, hasta: string): Promise<number>;
  // Los viajes del ciudadano sin sus puntos y los mas recientes primero
  listar(usuarioId: number): Promise<Viaje[]>;
}
