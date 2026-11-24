import { Module } from '@nestjs/common';
import { ActualizarContactoUseCase } from './application/actualizar-contacto.use-case';
import { AgregarContactoUseCase } from './application/agregar-contacto.use-case';
import { CONTACTOS_REPOSITORY, ContactosRepositoryPort } from './application/contactos.repository.port';
import { EliminarContactoUseCase } from './application/eliminar-contacto.use-case';
import { ListarContactosUseCase } from './application/listar-contactos.use-case';
import { NOTIFICADOR_INVITACIONES, NotificadorInvitacionesPort } from './application/notificador-invitaciones.port';
import { OrdenarContactosUseCase } from './application/ordenar-contactos.use-case';
import { ReenviarInvitacionUseCase } from './application/reenviar-invitacion.use-case';
import { ResponderInvitacionUseCase } from './application/responder-invitacion.use-case';
import { CorreoNotificadorInvitaciones } from './infrastructure/correo-notificador-invitaciones';
import { PostgresContactosRepository } from './infrastructure/postgres-contactos.repository';
import { RegistroNotificadorInvitaciones } from './infrastructure/registro-notificador-invitaciones';

// Casos de uso que solo leen y guardan contactos
const SOLO_CONTACTOS = [ListarContactosUseCase, EliminarContactoUseCase, OrdenarContactosUseCase, ResponderInvitacionUseCase];
// Casos de uso que ademas envian la invitacion por correo
const CON_INVITACION = [AgregarContactoUseCase, ActualizarContactoUseCase, ReenviarInvitacionUseCase];

// Contactos de emergencia del ciudadano guardados en su cuenta en PostgreSQL, con su invitacion por correo
@Module({
  providers: [
    { provide: CONTACTOS_REPOSITORY, useClass: PostgresContactosRepository },
    // Con SMTP_HOST la invitacion llega al correo del contacto y sin el los enlaces solo quedan en el registro de la api
    {
      provide: NOTIFICADOR_INVITACIONES,
      useFactory: () => (process.env.SMTP_HOST ? new CorreoNotificadorInvitaciones() : new RegistroNotificadorInvitaciones()),
    },
    // Se arman con una fabrica porque la capa de aplicacion no conoce NestJS
    ...SOLO_CONTACTOS.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (contactos: ContactosRepositoryPort) => new CasoDeUso(contactos),
      inject: [CONTACTOS_REPOSITORY],
    })),
    ...CON_INVITACION.map((CasoDeUso) => ({
      provide: CasoDeUso,
      useFactory: (contactos: ContactosRepositoryPort, notificador: NotificadorInvitacionesPort) => new CasoDeUso(contactos, notificador),
      inject: [CONTACTOS_REPOSITORY, NOTIFICADOR_INVITACIONES],
    })),
  ],
  exports: [...SOLO_CONTACTOS, ...CON_INVITACION],
})
export class ContactosModule {}
