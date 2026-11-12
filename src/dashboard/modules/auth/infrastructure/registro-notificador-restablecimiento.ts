import { Injectable, Logger } from '@nestjs/common';
import { AvisoRestablecimiento, NotificadorRestablecimientoPort } from '../application/notificador-restablecimiento.port';

// Ruta de la pantalla del frontend que recibe el token y pide la contrasena nueva
const RUTA_RESTABLECER = '/restablecer-contrasena';

// Todavia no hay servidor de correo asi que el enlace se escribe en el registro de la api
// cuando exista un servicio de correo se crea otro adaptador de este puerto y se cambia en auth.module.ts
@Injectable()
export class RegistroNotificadorRestablecimiento implements NotificadorRestablecimientoPort {
  private readonly registro = new Logger('RestablecerContrasena');

  async enviar(aviso: AvisoRestablecimiento): Promise<void> {
    // DASHBOARD_URL es la direccion del frontend del dashboard y sin ella solo se muestra la ruta
    const enlace = `${process.env.DASHBOARD_URL ?? ''}${RUTA_RESTABLECER}?token=${aviso.token}`;
    this.registro.log(`Enlace para ${aviso.correo} valido hasta ${aviso.venceEn.toISOString()}: ${enlace}`);
  }
}
