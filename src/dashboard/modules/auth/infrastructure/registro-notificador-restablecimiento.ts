import { Injectable, Logger } from '@nestjs/common';
import { AvisoRestablecimiento, NotificadorRestablecimientoPort } from '../application/notificador-restablecimiento.port';
import { enlaceDeRestablecimiento } from './enlace-restablecimiento';

// Sin servidor de correo configurado el enlace se escribe en el registro de la api
// sirve para trabajar en local y cuando hay SMTP_HOST en el .env se usa el notificador por correo
@Injectable()
export class RegistroNotificadorRestablecimiento implements NotificadorRestablecimientoPort {
  private readonly registro = new Logger('RestablecerContrasena');

  async enviar(aviso: AvisoRestablecimiento): Promise<void> {
    this.registro.log(`Enlace para ${aviso.correo} valido hasta ${aviso.venceEn.toISOString()}: ${enlaceDeRestablecimiento(aviso.token)}`);
  }
}
