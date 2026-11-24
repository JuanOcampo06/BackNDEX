import { DomainError } from '../../../../shared/domain-error';

// El token es de un ciudadano que ya no existe (por ejemplo, se borro su cuenta)
export class UsuarioNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('USUARIO_NO_ENCONTRADO', `No existe el usuario ${id}`);
  }
}
