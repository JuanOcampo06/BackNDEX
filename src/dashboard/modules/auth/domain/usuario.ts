// Cuenta de un usuario del dashboard tal como la necesita el inicio de sesion
// sin contrasena cifrada el usuario todavia no puede entrar
export interface CuentaUsuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  contrasenaCifrada: string | null;
}

const MINIMO_CONTRASENA = 8;
const MAXIMO_CONTRASENA = 72;

// Los correos se guardan en minusculas y asi se buscan
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}

// Mismas reglas de largo que usa la gestion de usuarios
export function contrasenaTieneLargoValido(contrasena: string): boolean {
  return contrasena.length >= MINIMO_CONTRASENA && contrasena.length <= MAXIMO_CONTRASENA;
}

export const MENSAJE_LARGO_CONTRASENA = `La contrasena debe tener entre ${MINIMO_CONTRASENA} y ${MAXIMO_CONTRASENA} caracteres`;
