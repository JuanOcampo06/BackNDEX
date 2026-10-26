import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { crearCambiosUsuario, DatosUsuario, Usuario } from '../domain/usuario';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Cambia el nombre el correo o el rol de un usuario existente
export class ActualizarUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  async execute(id: number, datos: DatosUsuario): Promise<Usuario> {
    const cambios = crearCambiosUsuario(datos);
    if ((await this.usuarios.buscarPorId(id)) === null) {
      throw new UsuarioNoEncontradoError(id);
    }
    if (cambios.correo !== undefined && (await this.usuarios.existeCorreo(cambios.correo, id))) {
      throw new CorreoDuplicadoError(cambios.correo);
    }
    return this.usuarios.actualizar(id, cambios);
  }
}
