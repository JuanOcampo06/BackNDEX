import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { AvisoInvitacion, NotificadorInvitacionesPort } from '../application/notificador-invitaciones.port';
import { enlaceRespuesta, escaparHtml } from './enlaces-invitacion';

const PUERTO_POR_DEFECTO = 587;

// Envia la invitacion al contacto con la misma cuenta SMTP de los codigos de verificacion y de restablecer contrasena
// el correo trae dos botones, Acepto y No acepto, que abren la pagina donde el contacto confirma su respuesta
@Injectable()
export class CorreoNotificadorInvitaciones implements NotificadorInvitacionesPort {
  private readonly registro = new Logger('InvitacionesContactos');
  private readonly remitente = process.env.SMTP_FROM || process.env.SMTP_USER || '';
  private readonly transporte: Transporter = createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || PUERTO_POR_DEFECTO),
    // true solo con el puerto 465 y en los demas la conexion se cifra con STARTTLS
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });

  async enviarInvitacion(aviso: AvisoInvitacion): Promise<void> {
    const acepto = enlaceRespuesta(aviso.token, 'acepto');
    const rechazo = enlaceRespuesta(aviso.token, 'rechazo');
    const vence = aviso.venceEn.toLocaleDateString('es-CO', { timeZone: 'America/Bogota', day: 'numeric', month: 'long', year: 'numeric' });
    try {
      await this.transporte.sendMail({
        from: this.remitente,
        to: aviso.correo,
        subject: `${aviso.nombreCiudadano} te invita a ser su contacto de emergencia en SafePath Twin`,
        text: [
          `Hola ${aviso.nombreContacto}:`,
          '',
          `${aviso.nombreCiudadano} te invita a ser parte de sus contactos de emergencia en SafePath Twin.`,
          'Si acepta, podrá llamarte desde el botón SOS de la app cuando necesite ayuda en la vía.',
          '',
          `Acepto: ${acepto}`,
          `No acepto: ${rechazo}`,
          '',
          `La invitación vence el ${vence}. Si no conoces a esta persona, ignora este correo.`,
        ].join('\n'),
        html: correoHtml(aviso, acepto, rechazo, vence),
      });
    } catch (error) {
      // Si el correo falla el contacto se guarda igual y el ciudadano puede reenviar la invitacion; el error queda en el registro de la api
      this.registro.error(`No se pudo enviar la invitacion a ${aviso.correo}: ${(error as Error).message}`);
    }
  }
}

function correoHtml(aviso: AvisoInvitacion, acepto: string, rechazo: string, vence: string): string {
  const ciudadano = escaparHtml(aviso.nombreCiudadano);
  const contacto = escaparHtml(aviso.nombreContacto);
  const boton = (enlace: string, texto: string, fondo: string, color: string) =>
    `<a href="${escaparHtml(enlace)}" style="display:inline-block;padding:12px 28px;margin:6px;border-radius:8px;background:${fondo};color:${color};text-decoration:none;font-weight:bold;font-family:Arial,sans-serif">${texto}</a>`;
  return `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">
  <h2 style="color:#0b2a5b">SafePath Twin</h2>
  <p>Hola ${contacto}:</p>
  <p><strong>${ciudadano}</strong> te invita a ser parte de sus <strong>contactos de emergencia</strong> en SafePath Twin.</p>
  <p>Si aceptas, podrá llamarte desde el botón SOS de la app cuando necesite ayuda en la vía.</p>
  <p style="text-align:center">${boton(acepto, 'Acepto', '#0b2a5b', '#ffffff')}${boton(rechazo, 'No acepto', '#e5e7eb', '#1f2937')}</p>
  <p style="font-size:13px;color:#6b7280">La invitación vence el ${escaparHtml(vence)}. Si no conoces a esta persona, ignora este correo.</p>
</div>`;
}
