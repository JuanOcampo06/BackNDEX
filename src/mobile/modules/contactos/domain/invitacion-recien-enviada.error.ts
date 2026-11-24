import { DomainError } from '../../../../shared/domain-error';
import { SEGUNDOS_ENTRE_INVITACIONES } from './contacto';

// Se pidio reenviar la invitacion muy poco despues de la anterior
export class InvitacionRecienEnviadaError extends DomainError {
  constructor() {
    super('INVITACION_RECIEN_ENVIADA', `Espera ${SEGUNDOS_ENTRE_INVITACIONES} segundos antes de volver a enviar la invitacion`);
  }
}
