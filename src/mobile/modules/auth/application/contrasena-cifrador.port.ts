export const CONTRASENA_CIFRADOR = Symbol('CONTRASENA_CIFRADOR');

// Puerto para cifrar y comparar contrasenas y asi la aplicacion no depende de ninguna libreria de cifrado
export interface ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string>;
  coincide(contrasena: string, contrasenaCifrada: string): Promise<boolean>;
}
