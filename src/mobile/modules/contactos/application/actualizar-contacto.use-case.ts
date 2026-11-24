import { aplicarCambiosContacto, CambiosContacto, ContactoEmergencia } from '../domain/contacto';
import { ContactoNoEncontradoError } from '../domain/contacto-no-encontrado.error';
import { ContactosRepositoryPort } from './contactos.repository.port';
import { invitar } from './invitar';
import { NotificadorInvitacionesPort } from './notificador-invitaciones.port';

// Cambia solo lo que se manda de un contacto del ciudadano; si cambia el correo se envia la invitacion al correo nuevo
export class ActualizarContactoUseCase {
  constructor(
    private readonly contactos: ContactosRepositoryPort,
    private readonly notificador: NotificadorInvitacionesPort,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(usuarioId: number, contactoId: number, cambios: CambiosContacto): Promise<ContactoEmergencia> {
    const actual = (await this.contactos.listar(usuarioId)).find((contacto) => contacto.id === contactoId);
    if (actual === undefined) {
      throw new ContactoNoEncontradoError(contactoId);
    }
    const nuevo = aplicarCambiosContacto(actual, cambios);
    await this.contactos.actualizar(usuarioId, nuevo);
    if (nuevo.correo !== actual.correo) {
      await invitar(this.contactos, this.notificador, usuarioId, nuevo, this.ahora());
    }
    return nuevo;
  }
}
