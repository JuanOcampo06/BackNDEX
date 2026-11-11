import { Injectable } from '@nestjs/common';
import { Usuario } from '../domain/usuario';
import { UsuarioRepositoryPort } from '../application/usuario.repository.port';

// Usuarios de prueba para el login con uno por cada rol del dashboard
// admin es el Administrador y lector es el Usuario que solo consulta
const USUARIOS_DE_PRUEBA: readonly Usuario[] = [
  new Usuario({
    id: '1',
    nombreCompleto: 'Admin Demo',
    correo: 'admin@demo.local',
    rol: 'admin',
    contrasena: 'demo1234',
  }),
  new Usuario({
    id: '2',
    nombreCompleto: 'Lector Demo',
    correo: 'lector@demo.local',
    rol: 'lector',
    contrasena: 'demo1234',
  }),
];

@Injectable()
export class InMemoryUsuarioRepository implements UsuarioRepositoryPort {
  async buscarPorCorreo(correo: string): Promise<Usuario | null> {
    return USUARIOS_DE_PRUEBA.find((usuario) => usuario.correo === correo) ?? null;
  }
}
