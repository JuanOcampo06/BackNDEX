import { validarCorreo } from '../domain/ciudadano';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { CodigosRepositoryPort } from './codigos.repository.port';
import { NotificadorCodigosPort } from './notificador-codigos.port';
import { fechasDelCodigo } from './vigencia-codigo';

export interface SolicitarVerificacionCommand {
  correo: string;
  ahora: Date;
}

// Lo que necesita quien pide el codigo de verificacion sin saber como se crea ni se envia
export interface SolicitaVerificacion {
  execute(comando: SolicitarVerificacionCommand): Promise<void>;
}

// Crea el codigo de un solo uso para verificar el correo y se lo envia al ciudadano
// se usa al registrarse y cuando el ciudadano pide que se lo reenvien
// si el correo no esta registrado, ya esta verificado o se pidio un codigo hace muy poco, no hace nada y responde igual para no revelar nada
export class SolicitarVerificacionUseCase implements SolicitaVerificacion {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly verificaciones: CodigosRepositoryPort,
    private readonly notificador: NotificadorCodigosPort,
  ) {}

  async execute(comando: SolicitarVerificacionCommand): Promise<void> {
    const cuenta = await this.ciudadanos.buscarPorCorreo(validarCorreo(comando.correo));
    if (cuenta === null || cuenta.correoVerificado) {
      return;
    }
    const { desde, venceEn } = fechasDelCodigo(comando.ahora);
    if (await this.verificaciones.haySolicitudDesde(cuenta.id, desde)) {
      return;
    }
    const codigo = await this.verificaciones.crear(cuenta.id, comando.ahora, venceEn);
    await this.notificador.enviarVerificacion({ correo: cuenta.correo, nombreCompleto: cuenta.nombreCompleto, codigo, venceEn });
  }
}
