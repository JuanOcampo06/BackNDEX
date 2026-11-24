import { DomainError } from '../../../../shared/domain-error';

// Solo se reenvia la invitacion a un contacto que todavia no ha contestado
export class InvitacionNoPendienteError extends DomainError {
  constructor() {
    super('INVITACION_NO_PENDIENTE', 'El contacto ya contesto la invitacion');
  }
}
