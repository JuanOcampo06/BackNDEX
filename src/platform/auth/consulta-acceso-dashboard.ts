// El guard del dashboard pregunta por aqui el estado actual del usuario del token
// platform no conoce la tabla de usuarios asi que el BFF del dashboard conecta esta consulta con su modulo auth
export const CONSULTA_ACCESO_DASHBOARD = Symbol('CONSULTA_ACCESO_DASHBOARD');

export interface EstadoAccesoDashboard {
  rol: string;
  // Mientras sea true solo puede usar los endpoints marcados con @PermitidoSinCambiarContrasena()
  debeCambiarContrasena: boolean;
}

export interface ConsultaAccesoDashboard {
  // null si el usuario ya no existe
  estadoActual(usuarioId: number): Promise<EstadoAccesoDashboard | null>;
}
