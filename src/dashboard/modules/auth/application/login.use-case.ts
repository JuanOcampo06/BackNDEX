import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
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

// El token lleva el rol del usuario para que los endpoints solo de administrador lo puedan revisar
export class LoginUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly tokens: TokenEmisorPort,
  ) {}

  async execute(comando: LoginCommand): Promise<LoginResult> {
    const usuario = await this.usuarios.buscarPorCorreo(comando.correo);
    if (!usuario || !usuario.tieneContrasena(comando.contrasena)) {
      throw new CredencialesInvalidasError();
    }
    const { id, nombreCompleto, correo, rol } = usuario;
    return { token: this.tokens.emitir(id, rol), usuario: { id, nombreCompleto, correo, rol } };
  }
}
