import { RestablecimientoInvalidoError } from '../domain/restablecimiento-invalido.error';
import { contrasenaTieneLargoValido, MENSAJE_LARGO_CONTRASENA } from '../domain/usuario';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { RestablecimientosRepositoryPort } from './restablecimientos.repository.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

export interface ConfirmarRestablecimientoCommand {
  token: string;
  contrasenaNueva: string;
  ahora: Date;
}

// Cambia la contrasena con el token del enlace y el token ya no vuelve a servir
export class ConfirmarRestablecimientoUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly restablecimientos: RestablecimientosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute(comando: ConfirmarRestablecimientoCommand): Promise<void> {
    // Se revisa la contrasena antes de gastar el token para que un error de escritura no obligue a pedir otro enlace
    if (!contrasenaTieneLargoValido(comando.contrasenaNueva)) {
      throw new RestablecimientoInvalidoError(MENSAJE_LARGO_CONTRASENA);
    }
    const usuarioId = await this.restablecimientos.consumir(comando.token, comando.ahora);
    if (usuarioId === null) {
      throw new RestablecimientoInvalidoError('El enlace para restablecer la contrasena no es valido o ya vencio');
    }
    await this.usuarios.cambiarContrasena(usuarioId, await this.cifrador.cifrar(comando.contrasenaNueva));
  }
}
