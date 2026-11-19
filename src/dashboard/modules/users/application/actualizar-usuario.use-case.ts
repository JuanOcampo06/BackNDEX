import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { CambiosParaGuardar, crearCambiosUsuario, DatosUsuario, Usuario } from '../domain/usuario';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

// Cambia el nombre el correo el rol la entidad o la contrasena de un usuario existente
// tambien lo usa el perfil propio pero sin dejar cambiar el rol
// editadoPor es quien hace el cambio: si le pone contrasena a otro usuario ese usuario debe cambiarla en su proximo ingreso
// y si se la pone a si mismo no porque ya la conoce
export class ActualizarUsuarioUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute(id: number, datos: DatosUsuario, editadoPor?: number): Promise<Usuario> {
    const { contrasena, ...cambios } = crearCambiosUsuario(datos);
    if ((await this.usuarios.buscarPorId(id)) === null) {
      throw new UsuarioNoEncontradoError(id);
    }
    if (cambios.correo !== undefined && (await this.usuarios.existeCorreo(cambios.correo, id))) {
      throw new CorreoDuplicadoError(cambios.correo);
    }
    const paraGuardar: CambiosParaGuardar = { ...cambios };
    if (contrasena !== undefined) {
      paraGuardar.contrasenaCifrada = await this.cifrador.cifrar(contrasena);
      paraGuardar.debeCambiarContrasena = editadoPor !== id;
    }
    return this.usuarios.actualizar(id, paraGuardar);
  }
}
