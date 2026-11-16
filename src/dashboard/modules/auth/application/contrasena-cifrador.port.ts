export const CONTRASENA_CIFRADOR = Symbol('AUTH_CONTRASENA_CIFRADOR');

// Puerto para comparar la contrasena del login y cifrar la nueva al restablecerla
export interface ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string>;
  coincide(contrasena: string, contrasenaCifrada: string): Promise<boolean>;
}
