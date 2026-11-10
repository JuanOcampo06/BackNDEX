import { Ciudadano, NuevoCiudadano } from '../domain/ciudadano';

export const CIUDADANOS_REPOSITORY = Symbol('CIUDADANOS_REPOSITORY');

// Ciudadano junto a su contrasena cifrada y solo se usa para iniciar sesion
export interface CiudadanoConClave extends Ciudadano {
  contrasenaCifrada: string;
}

// Puerto que el modulo necesita para guardar y leer ciudadanos sin saber de que base de datos vienen
export interface CiudadanosRepositoryPort {
  existeCorreo(correo: string): Promise<boolean>;
  crear(ciudadano: NuevoCiudadano, contrasenaCifrada: string): Promise<Ciudadano>;
  buscarPorCorreo(correo: string): Promise<CiudadanoConClave | null>;
}
