import { DomainError } from '../../../../shared/domain-error';

// El enlace de la invitacion no existe, ya se contesto o ya vencio
export class InvitacionInvalidaError extends DomainError {
  constructor() {
    super('INVITACION_INVALIDA', 'Esta invitacion ya no es valida: puede que ya la hayas contestado o que haya vencido');
  }
}
