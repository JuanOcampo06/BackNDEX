import { Usuario } from '../domain/usuario';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Devuelve un usuario por su id o avisa que no existe
export class ObtenerUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  async execute(id: number): Promise<Usuario> {
    const usuario = await this.usuarios.buscarPorId(id);
    if (usuario === null) {
      throw new UsuarioNoEncontradoError(id);
    }
    return usuario;
  }
}
