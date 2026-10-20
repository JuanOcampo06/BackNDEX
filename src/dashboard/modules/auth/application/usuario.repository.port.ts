import { Usuario } from '../domain/usuario';

export const USUARIO_REPOSITORY = Symbol('USUARIO_REPOSITORY');

export interface UsuarioRepositoryPort {
  buscarPorCorreo(correo: string): Promise<Usuario | null>;
}
