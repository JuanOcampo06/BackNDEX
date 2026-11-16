// Cuenta de un usuario del dashboard tal como la necesita el inicio de sesion
// sin contrasena cifrada el usuario todavia no puede entrar
export interface CuentaUsuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  entidad: string | null;
  contrasenaCifrada: string | null;
}

// Los correos se guardan en minusculas y asi se buscan
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}
