import { DomainError } from '../../../../shared/domain-error';

// El ciudadano que intenta activar el boton no esta registrado
export class UsuarioNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('USUARIO_NO_ENCONTRADO', `No existe el usuario ${id}`);
  }
}
