export const CONTRASENA_CIFRADOR = Symbol('USUARIOS_CONTRASENA_CIFRADOR');

// Puerto para cifrar la contrasena que el Administrador le asigna a un usuario
export interface ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string>;
}
