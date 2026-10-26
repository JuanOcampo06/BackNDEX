import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Elimina un usuario del dashboard o avisa que no existe
export class EliminarUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  async execute(id: number): Promise<void> {
    if (!(await this.usuarios.eliminar(id))) {
      throw new UsuarioNoEncontradoError(id);
    }
  }
}
