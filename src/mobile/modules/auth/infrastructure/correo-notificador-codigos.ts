import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AvisoCodigo, NotificadorCodigosPort } from '../application/notificador-codigos.port';

const PUERTO_POR_DEFECTO = 587;

// Envia los codigos por correo con el mismo servidor SMTP que usa el resto de la api
// se usa cuando en el .env esta SMTP_HOST y los datos de la cuenta que envia
@Injectable()
export class CorreoNotificadorCodigos implements NotificadorCodigosPort {
  private readonly registro = new Logger('CodigosMovil');
  private readonly remitente = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  private readonly transporte: Transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || PUERTO_POR_DEFECTO),
    // true solo con el puerto 465 y en los demas la conexion se cifra con STARTTLS
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });

  enviarRestablecimiento(aviso: AvisoCodigo): Promise<void> {
    return this.enviar(aviso, {
      asunto: 'Tu código para restablecer la contraseña de SafePath Twin',
      motivo: 'Recibimos una solicitud para restablecer la contraseña de tu cuenta de SafePath Twin.',
      despedida: 'Si no la pediste, ignora este correo y tu contraseña seguirá igual.',
    });
  }

  enviarVerificacion(aviso: AvisoCodigo): Promise<void> {
    return this.enviar(aviso, {
      asunto: 'Tu código para verificar tu cuenta de SafePath Twin',
      motivo: 'Creaste una cuenta en SafePath Twin y necesitamos verificar tu correo.',
      despedida: 'Si no creaste una cuenta, ignora este correo.',
    });
  }

  private async enviar(aviso: AvisoCodigo, texto: { asunto: string; motivo: string; despedida: string }): Promise<void> {
    const vence = aviso.venceEn.toLocaleString('es-CO', { timeZone: 'America/Bogota' });
    try {
      await this.transporte.sendMail({
        from: this.remitente,
        to: aviso.correo,
        subject: texto.asunto,
        text: [
          `Hola ${aviso.nombreCompleto}:`,
          '',
          texto.motivo,
          `Escribe este código en la app (sirve una sola vez y vence el ${vence}):`,
          '',
          aviso.codigo,
          '',
          texto.despedida,
        ].join('\n'),
      });
    } catch (error) {
      // Si el correo falla no se le avisa a quien pidio el codigo para no revelar si el correo existe, pero queda escrito en el registro de la api
      this.registro.error(`No se pudo enviar el correo a ${aviso.correo}: ${(error as Error).message}`);
    }
  }
}
