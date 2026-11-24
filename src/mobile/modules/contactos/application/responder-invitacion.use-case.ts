import { estadoPorRespuesta, RespuestaInvitacion } from '../domain/contacto';
import { InvitacionInvalidaError } from '../domain/invitacion-invalida.error';
import { ContactosRepositoryPort, Invitacion } from './contactos.repository.port';

// Nombres que muestra la pagina de la invitacion
export interface DatosInvitacion {
  ciudadano: string;
  contacto: string;
}

// El contacto abre el enlace del correo (ver) y confirma si acepta o no (execute)
// solo sirve una invitacion que existe, que no se ha contestado y que no ha vencido
export class ResponderInvitacionUseCase {
  constructor(
    private readonly contactos: ContactosRepositoryPort,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async ver(token: string): Promise<DatosInvitacion> {
    const invitacion = await this.vigente(token);
    return { ciudadano: invitacion.ciudadano, contacto: invitacion.contacto };
  }

  async execute(token: string, respuesta: RespuestaInvitacion): Promise<DatosInvitacion> {
    const invitacion = await this.vigente(token);
    await this.contactos.responderInvitacion(invitacion.contactoId, estadoPorRespuesta(respuesta), this.ahora());
    return { ciudadano: invitacion.ciudadano, contacto: invitacion.contacto };
  }

  private async vigente(token: string): Promise<Invitacion> {
    const invitacion = await this.contactos.buscarInvitacion(token);
    if (invitacion === null || invitacion.estado !== 'pendiente' || invitacion.venceEn <= this.ahora()) {
      throw new InvitacionInvalidaError();
    }
    return invitacion;
  }
}
