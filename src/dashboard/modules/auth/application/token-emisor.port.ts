export const TOKEN_EMISOR = Symbol('TOKEN_EMISOR');

// Emite el token de sesion del dashboard con el id y el rol del usuario
export interface TokenEmisorPort {
  emitir(usuarioId: string, rol: string): string;
}
