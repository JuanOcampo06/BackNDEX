export const NOTIFICADOR_INVITACIONES = Symbol('NOTIFICADOR_INVITACIONES');

// Lo que lleva el correo de invitacion al contacto
export interface AvisoInvitacion {
  correo: string;
  nombreContacto: string;
  nombreCiudadano: string;
  // Va en los enlaces de Acepto y No acepto
  token: string;
  venceEn: Date;
}

// Puerto para enviar la invitacion al contacto sin saber por que medio llega
export interface NotificadorInvitacionesPort {
  enviarInvitacion(aviso: AvisoInvitacion): Promise<void>;
}
