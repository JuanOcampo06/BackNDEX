import { SEGUNDOS_ENTRE_INVITACIONES } from '../domain/contacto';
import { ContactoNoEncontradoError } from '../domain/contacto-no-encontrado.error';
import { InvitacionNoPendienteError } from '../domain/invitacion-no-pendiente.error';
import { InvitacionRecienEnviadaError } from '../domain/invitacion-recien-enviada.error';
import { ContactosRepositoryPort } from './contactos.repository.port';
import { invitar } from './invitar';
import { NotificadorInvitacionesPort } from './notificador-invitaciones.port';

const MS_POR_SEGUNDO = 1000;

// Vuelve a enviar la invitacion a un contacto que todavia no contesta; el enlace anterior deja de servir
export class ReenviarInvitacionUseCase {
  constructor(
    private readonly contactos: ContactosRepositoryPort,
    private readonly notificador: NotificadorInvitacionesPort,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(usuarioId: number, contactoId: number): Promise<void> {
    const contacto = (await this.contactos.listar(usuarioId)).find((c) => c.id === contactoId);
    if (contacto === undefined) {
      throw new ContactoNoEncontradoError(contactoId);
    }
    if (contacto.estado !== 'pendiente') {
      throw new InvitacionNoPendienteError();
    }
    const ahora = this.ahora();
    const anterior = await this.contactos.invitacionEnviadaEn(usuarioId, contactoId);
    if (anterior !== null && ahora.getTime() - anterior.getTime() < SEGUNDOS_ENTRE_INVITACIONES * MS_POR_SEGUNDO) {
      throw new InvitacionRecienEnviadaError();
    }
    await invitar(this.contactos, this.notificador, usuarioId, contacto, ahora);
  }
}
