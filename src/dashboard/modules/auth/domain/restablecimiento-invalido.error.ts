import { DomainError } from '../../../../shared/domain-error';

// El enlace para restablecer no sirve porque no existe ya se uso o ya vencio o la contrasena nueva no cumple las reglas
export class RestablecimientoInvalidoError extends DomainError {
  constructor(mensaje: string) {
    super('RESTABLECIMIENTO_INVALIDO', mensaje);
  }
}
