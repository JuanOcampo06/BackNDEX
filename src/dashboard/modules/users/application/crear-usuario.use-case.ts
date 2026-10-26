import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { crearNuevoUsuario, DatosUsuario, Usuario } from '../domain/usuario';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Crea un usuario del dashboard si sus datos son validos y su correo no esta en uso
export class CrearUsuarioUseCase {
  constructor(private readonly usuarios: UsuariosRepositoryPort) {}

  async execute(datos: DatosUsuario): Promise<Usuario> {
    const nuevo = crearNuevoUsuario(datos);
    if (await this.usuarios.existeCorreo(nuevo.correo)) {
      throw new CorreoDuplicadoError(nuevo.correo);
    }
    return this.usuarios.crear(nuevo);
  }
}
