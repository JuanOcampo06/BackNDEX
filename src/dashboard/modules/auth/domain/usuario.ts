// Cuenta de un usuario del dashboard tal como la necesita el inicio de sesion
// sin contrasena cifrada el usuario todavia no puede entrar
export interface CuentaUsuario {
  id: number;
  nombreCompleto: string;
  correo: string;
  rol: string;
  entidad: string | null;
  contrasenaCifrada: string | null;
  // true si la contrasena la puso otra persona y el usuario debe cambiarla antes de usar el dashboard
  debeCambiarContrasena: boolean;
}

// Los correos se guardan en minusculas y asi se buscan
export function normalizarCorreo(correo: string): string {
  return correo.trim().toLowerCase();
}
