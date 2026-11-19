import { contrasenaCumpleReglas, MENSAJE_REGLAS_CONTRASENA } from '../../../../shared/reglas-contrasena';
import { ContrasenaInvalidaError } from '../domain/contrasena-invalida.error';
import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

export interface CambiarContrasenaCommand {
  usuarioId: number;
  contrasenaActual: string;
  contrasenaNueva: string;
}

// El propio usuario cambia su contrasena escribiendo la actual para que nadie la cambie con una sesion olvidada abierta
export class CambiarContrasenaUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute(comando: CambiarContrasenaCommand): Promise<void> {
    const cuenta = await this.usuarios.buscarPorId(comando.usuarioId);
    const actualCorrecta =
      cuenta !== null &&
      cuenta.contrasenaCifrada !== null &&
      (await this.cifrador.coincide(comando.contrasenaActual, cuenta.contrasenaCifrada));
    if (!actualCorrecta) {
      throw new CredencialesInvalidasError();
    }
    if (!contrasenaCumpleReglas(comando.contrasenaNueva)) {
      throw new ContrasenaInvalidaError(MENSAJE_REGLAS_CONTRASENA);
    }
    await this.usuarios.cambiarContrasena(cuenta.id, await this.cifrador.cifrar(comando.contrasenaNueva));
  }
}
