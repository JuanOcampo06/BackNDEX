import { colorLibre, ContactoEmergencia, contactosVigentes, DatosContacto, MAXIMO_CONTACTOS, validarDatosContacto } from '../domain/contacto';
import { LimiteDeContactosError } from '../domain/limite-de-contactos.error';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { ContactosRepositoryPort } from './contactos.repository.port';
import { invitar } from './invitar';
import { NotificadorInvitacionesPort } from './notificador-invitaciones.port';

// Agrega un contacto al final de la lista, pendiente y con el primer color libre, y le envia la invitacion por correo
export class AgregarContactoUseCase {
  constructor(
    private readonly contactos: ContactosRepositoryPort,
    private readonly notificador: NotificadorInvitacionesPort,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(usuarioId: number, datos: DatosContacto): Promise<ContactoEmergencia> {
    const limpios = validarDatosContacto(datos);
    const vigentes = contactosVigentes(await this.contactos.listar(usuarioId));
    if (vigentes.length >= MAXIMO_CONTACTOS) {
      throw new LimiteDeContactosError();
    }
    const color = colorLibre(vigentes.map((contacto) => contacto.color));
    const creado = await this.contactos.crear(usuarioId, { ...limpios, estado: 'pendiente', color });
    if (creado === null) {
      throw new UsuarioNoEncontradoError(usuarioId);
    }
    await invitar(this.contactos, this.notificador, usuarioId, creado, this.ahora());
    return creado;
  }
}
