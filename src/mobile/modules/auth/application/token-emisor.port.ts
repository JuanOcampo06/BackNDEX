export const TOKEN_EMISOR = Symbol('TOKEN_EMISOR');

// Puerto que entrega el token de acceso de un ciudadano y asi la aplicacion no sabe como se firma
export interface TokenEmisorPort {
  emitir(ciudadanoId: number): string;
}
