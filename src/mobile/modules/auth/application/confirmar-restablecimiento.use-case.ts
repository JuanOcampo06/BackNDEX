import { validarContrasena, validarCorreo } from '../domain/ciudadano';
import { RestablecimientoInvalidoError } from '../domain/restablecimiento-invalido.error';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { CodigosRepositoryPort } from './codigos.repository.port';

export interface ConfirmarRestablecimientoCommand {
  correo: string;
  codigo: string;
  contrasenaNueva: string;
  ahora: Date;
}

const MENSAJE_CODIGO_INVALIDO = 'El codigo para restablecer la contrasena no es valido o ya vencio';

// Cambia la contrasena con el codigo que llego al correo y el codigo ya no vuelve a servir
export class ConfirmarRestablecimientoUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly restablecimientos: CodigosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
  ) {}

  async execute(comando: ConfirmarRestablecimientoCommand): Promise<void> {
    // Se revisa la contrasena antes de gastar el codigo para que un error de escritura no obligue a pedir otro
    const contrasena = validarContrasena(comando.contrasenaNueva);
    const cuenta = await this.ciudadanos.buscarPorCorreo(validarCorreo(comando.correo));
    // Con un correo que no existe se responde igual que con un codigo malo para no revelar que correos estan registrados
    if (cuenta === null || !(await this.restablecimientos.consumir(cuenta.id, comando.codigo, comando.ahora))) {
      throw new RestablecimientoInvalidoError(MENSAJE_CODIGO_INVALIDO);
    }
    await this.ciudadanos.cambiarContrasena(cuenta.id, await this.cifrador.cifrar(contrasena));
  }
}
