import { CuentaUsuario } from '../domain/usuario';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

// Puerto para leer las cuentas de la tabla de usuarios del dashboard y cambiarles la contrasena
// cambiarContrasena guarda la que eligio el propio usuario y por eso le quita la marca de debe cambiarla
export interface UsuarioRepositoryPort {
  buscarPorCorreo(correo: string): Promise<CuentaUsuario | null>;
  buscarPorId(usuarioId: number): Promise<CuentaUsuario | null>;
  cambiarContrasena(usuarioId: number, contrasenaCifrada: string): Promise<void>;
  // Guarda la fecha del inicio de sesion para la columna ultimo ingreso de la lista de usuarios
  registrarIngreso(usuarioId: number): Promise<void>;
}
