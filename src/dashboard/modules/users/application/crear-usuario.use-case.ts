import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { crearNuevoUsuario, DatosUsuario, Usuario } from '../domain/usuario';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Crea un usuario del dashboard si sus datos son validos y su correo no esta en uso
// si llega una contrasena se guarda cifrada y con ella el usuario ya puede iniciar sesion
export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute(datos: DatosUsuario): Promise<Usuario> {
    const { contrasena, ...nuevo } = crearNuevoUsuario(datos);
    if (await this.usuarios.existeCorreo(nuevo.correo)) {
      throw new CorreoDuplicadoError(nuevo.correo);
    }
    const contrasenaCifrada = contrasena === undefined ? undefined : await this.cifrador.cifrar(contrasena);
    return this.usuarios.crear({ ...nuevo, contrasenaCifrada });
  }
}
