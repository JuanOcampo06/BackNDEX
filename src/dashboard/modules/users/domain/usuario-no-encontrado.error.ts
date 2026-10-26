import { DomainError } from '../../../../shared/domain-error';

export class UsuarioNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('USUARIO_NO_ENCONTRADO', `No existe el usuario ${id}`);
  }
}
