import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AvisoRestablecimiento, NotificadorRestablecimientoPort } from '../application/notificador-restablecimiento.port';
import { enlaceDeRestablecimiento } from './enlace-restablecimiento';

const PUERTO_POR_DEFECTO = 587;

// Envia el enlace para restablecer la contrasena por correo con el servidor SMTP de la entidad
// se usa cuando en el .env esta SMTP_HOST y los datos de la cuenta que envia
@Injectable()
export class CorreoNotificadorRestablecimiento implements NotificadorRestablecimientoPort {
  private readonly registro = new Logger('RestablecerContrasena');
  private readonly remitente = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  private readonly transporte: Transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || PUERTO_POR_DEFECTO),
    // true solo con el puerto 465 y en los demas la conexion se cifra con STARTTLS
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });

  async enviar(aviso: AvisoRestablecimiento): Promise<void> {
    const enlace = enlaceDeRestablecimiento(aviso.token);
    const vence = aviso.venceEn.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    try {
      await this.transporte.sendMail({
        from: this.remitente,
        to: aviso.correo,
        subject: 'Restablecer tu contraseña de SafePath Twin',
        text: [
          `Hola ${aviso.nombreCompleto}:`,
          '',
          'Recibimos una solicitud para restablecer tu contraseña del tablero de SafePath Twin.',
          `Abre este enlace para elegir una nueva (sirve una sola vez y vence el ${vence}):`,
          enlace,
          '',
          'Si no la pediste, ignora este correo y tu contraseña seguirá igual.',
        ].join('\n'),
      });
    } catch (error) {
      // Si el correo falla no se le avisa a quien pidio el enlace para no revelar si el correo existe
      this.registro.error(`No se pudo enviar el correo a ${aviso.correo}: ${(error as Error).message}`);
    }
  }
}
