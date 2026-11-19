import { Injectable, Logger } from '@nestjs/common';
import { AvisoCodigo, NotificadorCodigosPort } from '../application/notificador-codigos.port';

// Sin SMTP_HOST no se envia ningun correo y el codigo queda escrito en el registro de la api para poder probar en local
@Injectable()
export class RegistroNotificadorCodigos implements NotificadorCodigosPort {
  private readonly registro = new Logger('CodigosMovil');

  // Se avisa al arrancar para que no se tenga que esperar a que alguien pida un codigo para enterarse
  constructor() {
    this.registro.warn('SMTP_HOST no esta configurado: los codigos de verificacion y de restablecer contraseña NO se envian por correo y solo quedan en este registro');
  }

  async enviarRestablecimiento(aviso: AvisoCodigo): Promise<void> {
    this.escribir('restablecer contraseña', aviso);
  }

  async enviarVerificacion(aviso: AvisoCodigo): Promise<void> {
    this.escribir('verificar correo', aviso);
  }

  private escribir(para: string, aviso: AvisoCodigo): void {
    this.registro.warn(
      `SMTP_HOST no esta configurado y NO se envio ningun correo. Codigo para ${para} de ${aviso.correo}: ${aviso.codigo} (vence ${aviso.venceEn.toISOString()})`,
    );
  }
}
