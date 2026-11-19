import { ROL_ADMINISTRADOR } from '../domain/catalogos';
import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { crearNuevoUsuario } from '../domain/usuario';
import { UsuarioInvalidoError } from '../domain/usuario-invalido.error';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { UsuariosRepositoryPort } from './usuarios.repository.port';

const NOMBRE_ADMINISTRADOR_INICIAL = 'Administrador';

export interface DatosAdministradorInicial {
  correo?: string;
  contrasena?: string;
}

// creado: no habia ningun administrador y se creo con los datos recibidos
// ya-existe: ya habia un administrador y no se toco nada
// sin-datos: no llegaron ni el correo ni la contrasena y no se reviso la base
export type ResultadoAdministradorInicial = 'creado' | 'ya-existe' | 'sin-datos';

// Crea el primer administrador del dashboard cuando la base no tiene ninguno
// asi nadie depende de un usuario de prueba con una contrasena conocida
// como su contrasena la conoce quien configuro el entorno debe cambiarla en su primer ingreso
// si ya existe un administrador no hace nada para que reiniciar la api no lo duplique ni lo pise
export class CrearAdministradorInicialUseCase {
  constructor(
    private readonly usuarios: UsuariosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute({ correo, contrasena }: DatosAdministradorInicial): Promise<ResultadoAdministradorInicial> {
    if (correo === undefined && contrasena === undefined) {
      return 'sin-datos';
    }
    if (correo === undefined || contrasena === undefined) {
      throw new UsuarioInvalidoError('Para crear el administrador inicial se necesitan el correo y la contraseña');
    }
    // Se valida antes de mirar la base para que un correo o una contrasena invalidos en el entorno siempre detengan la api
    // aunque ya exista un administrador y asi nunca queden datos debiles guardados sin que nadie se entere
    const { contrasena: clave, ...nuevo } = crearNuevoUsuario({
      nombreCompleto: NOMBRE_ADMINISTRADOR_INICIAL,
      correo,
      rol: ROL_ADMINISTRADOR,
      contrasena,
    });
    if ((await this.usuarios.listar({ rol: ROL_ADMINISTRADOR })).length > 0) {
      return 'ya-existe';
    }
    if (await this.usuarios.existeCorreo(nuevo.correo)) {
      throw new CorreoDuplicadoError(nuevo.correo);
    }
    await this.usuarios.crear({ ...nuevo, contrasenaCifrada: await this.cifrador.cifrar(clave), debeCambiarContrasena: true });
    return 'creado';
  }
}
