import { validarCorreo } from '../domain/ciudadano';
import { VerificacionInvalidaError } from '../domain/verificacion-invalida.error';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { CodigosRepositoryPort } from './codigos.repository.port';
import { Sesion } from './sesion';
import { TokenEmisorPort } from './token-emisor.port';

export interface VerificarCorreoCommand {
  correo: string;
  codigo: string;
  ahora: Date;
}

const MENSAJE_CODIGO_INVALIDO = 'El codigo de verificacion no es valido o ya vencio';

// El ciudadano escribe el codigo que le llego al correo: el correo queda verificado, el codigo ya no vuelve a servir y recibe una sesion
export class VerificarCorreoUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly verificaciones: CodigosRepositoryPort,
    private readonly tokens: TokenEmisorPort,
  ) {}

  async execute(comando: VerificarCorreoCommand): Promise<Sesion> {
    const cuenta = await this.ciudadanos.buscarPorCorreo(validarCorreo(comando.correo));
    // Con un correo que no existe se responde igual que con un codigo malo para no revelar que correos estan registrados
    if (cuenta === null || !(await this.verificaciones.consumir(cuenta.id, comando.codigo, comando.ahora))) {
      throw new VerificacionInvalidaError(MENSAJE_CODIGO_INVALIDO);
    }
    await this.ciudadanos.marcarCorreoVerificado(cuenta.id);
    const { id, nombreCompleto, correo, fechaNacimiento, genero } = cuenta;
    return { accessToken: this.tokens.emitir(id), ciudadano: { id, nombreCompleto, correo, fechaNacimiento, genero } };
  }
}
