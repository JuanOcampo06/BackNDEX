import { CuentaUsuario } from '../domain/usuario';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

// Puerto para leer las cuentas de la tabla de usuarios del dashboard y cambiarles la contrasena
export interface UsuarioRepositoryPort {
  buscarPorCorreo(correo: string): Promise<CuentaUsuario | null>;
  cambiarContrasena(usuarioId: number, contrasenaCifrada: string): Promise<void>;
}
