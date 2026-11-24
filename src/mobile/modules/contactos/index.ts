// Unica puerta del modulo y lo unico que el BFF puede importar de aqui
export { ContactosModule } from './contactos.module';
export { COLORES_CONTACTO, ESTADOS_CONTACTO, MAXIMO_CONTACTOS, RESPUESTAS_INVITACION } from './domain/contacto';
export type { ColorContacto, ContactoEmergencia, EstadoContacto, RespuestaInvitacion } from './domain/contacto';
export { DomainError } from '../../../shared/domain-error';
export { ListarContactosUseCase } from './application/listar-contactos.use-case';
export { AgregarContactoUseCase } from './application/agregar-contacto.use-case';
export { ActualizarContactoUseCase } from './application/actualizar-contacto.use-case';
export { EliminarContactoUseCase } from './application/eliminar-contacto.use-case';
export { OrdenarContactosUseCase } from './application/ordenar-contactos.use-case';
export { ReenviarInvitacionUseCase } from './application/reenviar-invitacion.use-case';
export { ResponderInvitacionUseCase } from './application/responder-invitacion.use-case';
export type { DatosInvitacion } from './application/responder-invitacion.use-case';
export { CONTACTOS_REPOSITORY } from './application/contactos.repository.port';
export type { ContactosRepositoryPort, Invitacion, NuevoContacto } from './application/contactos.repository.port';
export { NOTIFICADOR_INVITACIONES } from './application/notificador-invitaciones.port';
export type { AvisoInvitacion, NotificadorInvitacionesPort } from './application/notificador-invitaciones.port';
