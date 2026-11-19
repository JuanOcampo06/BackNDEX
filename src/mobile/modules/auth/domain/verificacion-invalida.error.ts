import { DomainError } from '../../../../shared/domain-error';

// El codigo para verificar el correo no sirve porque no existe, ya se uso, ya vencio o se equivocaron demasiadas veces
export class VerificacionInvalidaError extends DomainError {
  constructor(mensaje: string) {
    super('VERIFICACION_INVALIDA', mensaje);
  }
}
