import { normalizarCorreo } from '../domain/usuario';
import { NotificadorRestablecimientoPort } from './notificador-restablecimiento.port';
import { RestablecimientosRepositoryPort } from './restablecimientos.repository.port';
import { UsuarioRepositoryPort } from './usuario.repository.port';

// El enlace dura una hora y despues hay que pedir otro
const MINUTOS_DE_VIGENCIA = 60;
const MS_POR_MINUTO = 60 * 1000;

export interface SolicitarRestablecimientoCommand {
  correo: string;
  ahora: Date;
}

// Crea un enlace de un solo uso y se lo envia al usuario
// si el correo no existe no hace nada y responde igual para no revelar que correos estan registrados
export class SolicitarRestablecimientoUseCase {
  constructor(
    private readonly usuarios: UsuarioRepositoryPort,
    private readonly restablecimientos: RestablecimientosRepositoryPort,
    private readonly notificador: NotificadorRestablecimientoPort,
  ) {}

  async execute(comando: SolicitarRestablecimientoCommand): Promise<void> {
    const cuenta = await this.usuarios.buscarPorCorreo(normalizarCorreo(comando.correo));
    if (cuenta === null) {
      return;
    }
    const venceEn = new Date(comando.ahora.getTime() + MINUTOS_DE_VIGENCIA * MS_POR_MINUTO);
    const token = await this.restablecimientos.crear(cuenta.id, venceEn);
    await this.notificador.enviar({ correo: cuenta.correo, nombreCompleto: cuenta.nombreCompleto, token, venceEn });
  }
}
