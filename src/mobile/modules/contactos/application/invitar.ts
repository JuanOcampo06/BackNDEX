import { ContactoEmergencia, DIAS_DE_VIGENCIA_INVITACION } from '../domain/contacto';
import { ContactosRepositoryPort } from './contactos.repository.port';
import { NotificadorInvitacionesPort } from './notificador-invitaciones.port';

const MS_POR_DIA = 86_400_000;

// Crea un enlace nuevo para el contacto y le envia el correo de invitacion con el nombre del ciudadano
export async function invitar(
  contactos: ContactosRepositoryPort,
  notificador: NotificadorInvitacionesPort,
  usuarioId: number,
  contacto: ContactoEmergencia,
  ahora: Date,
): Promise<void> {
  const venceEn = new Date(ahora.getTime() + DIAS_DE_VIGENCIA_INVITACION * MS_POR_DIA);
  const token = await contactos.nuevaInvitacion(contacto.id, { enviadaEn: ahora, venceEn });
  const nombreCiudadano = (await contactos.nombreDelCiudadano(usuarioId)) ?? 'Un usuario de SafePath Twin';
  await notificador.enviarInvitacion({ correo: contacto.correo, nombreContacto: contacto.nombre, nombreCiudadano, token, venceEn });
}
