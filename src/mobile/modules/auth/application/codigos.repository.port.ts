export const RESTABLECIMIENTOS_REPOSITORY = Symbol('RESTABLECIMIENTOS_REPOSITORY');
export const VERIFICACIONES_REPOSITORY = Symbol('VERIFICACIONES_REPOSITORY');

// Puerto para los codigos de un solo uso que le llegan al correo del ciudadano
// el mismo puerto sirve para restablecer la contrasena y para verificar el correo al registrarse, cada uno con su propia tabla
export interface CodigosRepositoryPort {
  // Crea el codigo, deja sin efecto los anteriores del ciudadano y devuelve el codigo que se envia al correo
  crear(usuarioId: number, ahora: Date, venceEn: Date): Promise<string>;
  // Dice si el ciudadano ya pidio un codigo desde la fecha indicada
  haySolicitudDesde(usuarioId: number, desde: Date): Promise<boolean>;
  // Marca el codigo como usado y devuelve true si servia
  // si no servia cuenta un intento fallido y despues de varios el codigo deja de servir aunque sea el correcto
  consumir(usuarioId: number, codigo: string, ahora: Date): Promise<boolean>;
}
