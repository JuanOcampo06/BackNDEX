import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { UsuarioRepositoryPort } from './usuario.repository.port';

// Token fijo de la demo; se reemplazará por un JWT emitido desde platform/auth.
const TOKEN_DE_PRUEBA = 'token-de-prueba';

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

export class LoginUseCase {
  constructor(private readonly usuarios: UsuarioRepositoryPort) {}

  async execute(comando: LoginCommand): Promise<LoginResult> {
    const usuario = await this.usuarios.buscarPorCorreo(comando.correo);
    if (!usuario || !usuario.tieneContrasena(comando.contrasena)) {
      throw new CredencialesInvalidasError();
    }
    const { id, nombreCompleto, correo, rol } = usuario;
    return { token: TOKEN_DE_PRUEBA, usuario: { id, nombreCompleto, correo, rol } };
  }
}
