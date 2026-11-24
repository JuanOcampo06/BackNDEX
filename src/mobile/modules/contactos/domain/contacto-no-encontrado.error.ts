import { DomainError } from '../../../../shared/domain-error';

// El contacto no existe o es de otro ciudadano: a los dos casos se responde igual para no revelar contactos ajenos
export class ContactoNoEncontradoError extends DomainError {
  constructor(id: number) {
    super('CONTACTO_NO_ENCONTRADO', `No existe el contacto ${id}`);
  }
}
