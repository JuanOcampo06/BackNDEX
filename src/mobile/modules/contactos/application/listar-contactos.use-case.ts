import { ContactoEmergencia } from '../domain/contacto';
import { ContactosRepositoryPort } from './contactos.repository.port';

// Contactos de emergencia de la cuenta en el orden que eligio el ciudadano (el primero sale primero en el SOS)
export class ListarContactosUseCase {
  constructor(private readonly contactos: ContactosRepositoryPort) {}

  execute(usuarioId: number): Promise<ContactoEmergencia[]> {
    return this.contactos.listar(usuarioId);
  }
}
