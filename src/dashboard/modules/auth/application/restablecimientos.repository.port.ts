export const RESTABLECIMIENTOS_REPOSITORY = Symbol('RESTABLECIMIENTOS_REPOSITORY');

// Puerto para los enlaces de un solo uso que restablecen la contrasena
export interface RestablecimientosRepositoryPort {
  // Crea el enlace y devuelve el token que se envia al correo
  crear(usuarioId: number, venceEn: Date): Promise<string>;
  // Marca el token como usado y devuelve el usuario si seguia vigente o null si no sirve
  consumir(token: string, ahora: Date): Promise<number | null>;
}
