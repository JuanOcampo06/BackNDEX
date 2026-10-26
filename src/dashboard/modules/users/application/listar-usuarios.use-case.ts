import { Usuario } from '../domain/usuario';
import { FiltrosUsuarios, UsuariosRepositoryPort } from './usuarios.repository.port';

// Lista los usuarios del dashboard y se puede filtrar por rol
export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  execute(filtros: FiltrosUsuarios): Promise<Usuario[]> {
    return this.usuarios.listar(filtros);
  }
}
