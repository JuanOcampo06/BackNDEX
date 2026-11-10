import { Ciudadano } from '../domain/ciudadano';

// Lo que recibe la app al registrarse o iniciar sesion
export interface Sesion {
  accessToken: string;
  ciudadano: Ciudadano;
}
