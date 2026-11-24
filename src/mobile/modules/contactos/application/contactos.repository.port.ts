import { ContactoEmergencia, EstadoContacto } from '../domain/contacto';

export const CONTACTOS_REPOSITORY = Symbol('CONTACTOS_REPOSITORY');

// Contacto listo para guardar, sin id porque lo pone la base de datos
export type NuevoContacto = Omit<ContactoEmergencia, 'id'>;

// Invitacion encontrada por su enlace con lo que se muestra en la pagina de respuesta
export interface Invitacion {
  contactoId: number;
  // Nombre del ciudadano que invita
  ciudadano: string;
  // Nombre del contacto invitado
  contacto: string;
  estado: EstadoContacto;
  venceEn: Date;
}

// Puerto para guardar los contactos de emergencia de cada ciudadano y sus invitaciones sin saber en que base de datos quedan
// siempre se busca por usuario y contacto juntos para que nadie toque contactos ajenos
export interface ContactosRepositoryPort {
  // En el orden que eligio el ciudadano
  listar(usuarioId: number): Promise<ContactoEmergencia[]>;
  // null si el ciudadano no existe
  crear(usuarioId: number, contacto: NuevoContacto): Promise<ContactoEmergencia | null>;
  actualizar(usuarioId: number, contacto: ContactoEmergencia): Promise<void>;
  // false si no existe o es de otro ciudadano
  eliminar(usuarioId: number, contactoId: number): Promise<boolean>;
  // ids en el orden nuevo
  ordenar(usuarioId: number, ids: number[]): Promise<void>;
  // Nombre del ciudadano para el correo de invitacion
  nombreDelCiudadano(usuarioId: number): Promise<string | null>;
  // Crea el enlace de la invitacion (el anterior deja de servir) y devuelve el token que va en el correo; en la base solo queda su hash
  nuevaInvitacion(contactoId: number, fechas: { enviadaEn: Date; venceEn: Date }): Promise<string>;
  // Cuando se envio la ultima invitacion del contacto
  invitacionEnviadaEn(usuarioId: number, contactoId: number): Promise<Date | null>;
  buscarInvitacion(token: string): Promise<Invitacion | null>;
  // Guarda la respuesta y el enlace deja de servir
  responderInvitacion(contactoId: number, estado: EstadoContacto, respondidoEn: Date): Promise<void>;
}
