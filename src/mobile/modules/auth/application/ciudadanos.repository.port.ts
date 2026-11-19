import { Ciudadano, NuevoCiudadano } from '../domain/ciudadano';
import { AceptacionTerminos } from '../domain/terminos';

export const CIUDADANOS_REPOSITORY = Symbol('CIUDADANOS_REPOSITORY');

// Ciudadano junto a su contrasena cifrada y si ya verifico su correo, y solo se usa dentro del modulo
export interface CiudadanoConClave extends Ciudadano {
  contrasenaCifrada: string;
  correoVerificado: boolean;
}

// Puerto que el modulo necesita para guardar y leer ciudadanos sin saber de que base de datos vienen
export interface CiudadanosRepositoryPort {
  existeCorreo(correo: string): Promise<boolean>;
  // Guarda al ciudadano y la constancia de que acepto los terminos o no guarda nada de las dos
  crear(ciudadano: NuevoCiudadano, contrasenaCifrada: string, aceptacion: AceptacionTerminos): Promise<Ciudadano>;
  buscarPorCorreo(correo: string): Promise<CiudadanoConClave | null>;
  cambiarContrasena(id: number, contrasenaCifrada: string): Promise<void>;
  marcarCorreoVerificado(id: number): Promise<void>;
}
