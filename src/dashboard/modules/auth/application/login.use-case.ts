import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { normalizarCorreo } from '../domain/usuario';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { TokenEmisorPort } from './token-emisor.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

export interface LoginCommand {
  correo: string;
  contrasena: string;
}

export interface LoginResult {
  token: string;
  usuario: {
    id: string;
    nombreCompleto: string;
    correo: string;
    rol: string;
  };
}

// Inicia sesion con los usuarios de la tabla del dashboard
// el token lleva el rol del usuario para que los endpoints solo de administrador lo puedan revisar
export class LoginUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
    private readonly tokens: TokenEmisorPort,
  ) {}

  async execute(comando: LoginCommand): Promise<LoginResult> {
    const cuenta = await this.usuarios.buscarPorCorreo(normalizarCorreo(comando.correo));
    // El mismo error para correo inexistente usuario sin contrasena o contrasena errada asi no se revela cual fallo
    const valida =
      cuenta !== null &&
      cuenta.contrasenaCifrada !== null &&
      (await this.cifrador.coincide(comando.contrasena, cuenta.contrasenaCifrada));
    if (!valida) {
      throw new CredencialesInvalidasError();
    }
    const id = String(cuenta.id);
    const { nombreCompleto, correo, rol } = cuenta;
    return { token: this.tokens.emitir(id, rol), usuario: { id, nombreCompleto, correo, rol } };
  }
}
