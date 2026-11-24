import { ContactoNoEncontradoError } from '../domain/contacto-no-encontrado.error';
import { ContactosRepositoryPort } from './contactos.repository.port';

// Borra un contacto del ciudadano y con el sus datos
export class EliminarContactoUseCase {
  constructor(private readonly contactos: ContactosRepositoryPort) {}

  async execute(usuarioId: number, contactoId: number): Promise<void> {
    if (!(await this.contactos.eliminar(usuarioId, contactoId))) {
      throw new ContactoNoEncontradoError(contactoId);
    }
  }
}
