import { Injectable } from '@nestjs/common';
import { Usuario } from '../domain/usuario';
import { UsuarioRepositoryPort } from '../application/usuario.repository.port';

// Un único usuario de prueba; se reemplazará por un adaptador de base de datos.
const USUARIOS_DE_PRUEBA: readonly Usuario[] = [
  new Usuario({
    id: '1',
    nombreCompleto: 'Admin Demo',
    correo: 'admin@demo.local',
    rol: 'admin',
    contrasena: 'demo1234',
  }),
];

@Injectable()
export class InMemoryUsuarioRepository implements UsuarioRepositoryPort {
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return USUARIOS_DE_PRUEBA.find((usuario) => usuario.correo === correo) ?? null;
  }
}
