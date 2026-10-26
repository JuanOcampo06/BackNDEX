import { Rol } from '../domain/catalogos';
import { CambiosUsuario, NuevoUsuario, Usuario } from '../domain/usuario';

export const USUARIOS_REPOSITORY = Symbol('USUARIOS_REPOSITORY');

// Filtro opcional para listar usuarios
export interface FiltrosUsuarios {
  rol?: Rol;
}

// Puerto para guardar y leer usuarios del dashboard sin saber de que base de datos vienen
export interface UsuariosRepositoryPort {
  listar(filtros: FiltrosUsuarios): Promise<Usuario[]>;
  buscarPorId(id: number): Promise<Usuario | null>;
  // Dice si otro usuario distinto al excluido ya usa ese correo
  existeCorreo(correo: string, idExcluido?: number): Promise<boolean>;
  crear(usuario: NuevoUsuario): Promise<Usuario>;
  actualizar(id: number, cambios: CambiosUsuario): Promise<Usuario>;
  // Devuelve false cuando no habia un usuario con ese id
  eliminar(id: number): Promise<boolean>;
}
