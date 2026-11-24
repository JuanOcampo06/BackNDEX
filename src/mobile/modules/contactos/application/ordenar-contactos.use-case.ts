import { ContactoEmergencia, validarOrden } from '../domain/contacto';
import { ContactosRepositoryPort } from './contactos.repository.port';

// Cambia el orden de los contactos: el primero es el que sale primero en el boton SOS
export class OrdenarContactosUseCase {
  constructor(private readonly contactos: ContactosRepositoryPort) {}

  async execute(usuarioId: number, ids: number[]): Promise<ContactoEmergencia[]> {
    validarOrden(ids, await this.contactos.listar(usuarioId));
    await this.contactos.ordenar(usuarioId, ids);
    return this.contactos.listar(usuarioId);
  }
}
