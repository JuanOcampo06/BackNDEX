import { DomainError } from '../../../../shared/domain-error';

// El codigo para restablecer no sirve porque no existe, ya se uso, ya vencio o se equivocaron demasiadas veces
export class RestablecimientoInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('RESTABLECIMIENTO_INVALIDO', mensaje);
  }
}
