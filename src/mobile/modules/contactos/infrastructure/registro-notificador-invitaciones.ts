import { Injectable, Logger } from '@nestjs/common';
import { AvisoInvitacion, NotificadorInvitacionesPort } from '../application/notificador-invitaciones.port';
import { enlaceRespuesta } from './enlaces-invitacion';

// Sin SMTP_HOST no se envia ningun correo y los enlaces de la invitacion quedan en el registro de la api para probar en local
@Injectable()
export class RegistroNotificadorInvitaciones implements NotificadorInvitacionesPort {
  private readonly registro = new Logger('InvitacionesContactos');

  async enviarInvitacion(aviso: AvisoInvitacion): Promise<void> {
    this.registro.warn(
      `SMTP_HOST no esta configurado y NO se envio la invitacion a ${aviso.correo}. Acepto: ${enlaceRespuesta(aviso.token, 'acepto')} | No acepto: ${enlaceRespuesta(aviso.token, 'rechazo')}`,
    );
  }
}
