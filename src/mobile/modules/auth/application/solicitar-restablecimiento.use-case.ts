import { validarCorreo } from '../domain/ciudadano';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { CodigosRepositoryPort } from './codigos.repository.port';
import { NotificadorCodigosPort } from './notificador-codigos.port';
import { fechasDelCodigo } from './vigencia-codigo';

export interface SolicitarRestablecimientoCommand {
  correo: string;
  ahora: Date;
}

// Crea un codigo de un solo uso y se lo envia al correo del ciudadano
// si el correo no esta registrado, o ya se pidio un codigo hace muy poco, no hace nada y responde igual para no revelar que correos existen
export class SolicitarRestablecimientoUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly restablecimientos: CodigosRepositoryPort,
    private readonly notificador: NotificadorCodigosPort,
  ) {}

  async execute(comando: SolicitarRestablecimientoCommand): Promise<void> {
    const cuenta = await this.ciudadanos.buscarPorCorreo(validarCorreo(comando.correo));
    if (cuenta === null) {
      return;
    }
    const { desde, venceEn } = fechasDelCodigo(comando.ahora);
    if (await this.restablecimientos.haySolicitudDesde(cuenta.id, desde)) {
      return;
    }
    const codigo = await this.restablecimientos.crear(cuenta.id, comando.ahora, venceEn);
    await this.notificador.enviarRestablecimiento({ correo: cuenta.correo, nombreCompleto: cuenta.nombreCompleto, codigo, venceEn });
  }
}
