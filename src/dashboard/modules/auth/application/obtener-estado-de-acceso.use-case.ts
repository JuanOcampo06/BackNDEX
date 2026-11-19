import { UsuarioRepositoryPort } from './usuario.repository.port';

// Lo que el guard del dashboard necesita saber hoy del usuario de un token
export interface EstadoDeAcceso {
  rol: string;
  debeCambiarContrasena: boolean;
}

// Estado actual en la base del usuario de un token del dashboard
// devuelve null si el usuario fue eliminado asi su token deja de servir de inmediato
// y si le cambiaron el rol o le pusieron una contrasena nueva vale lo de la base y no lo que quedo en el token
export class ObtenerEstadoDeAccesoUseCase {
  constructor(private readonly usuarios: UsuarioRepositoryPort) {}

  async execute(usuarioId: number): Promise<EstadoDeAcceso | null> {
    const cuenta = await this.usuarios.buscarPorId(usuarioId);
    return cuenta === null ? null : { rol: cuenta.rol, debeCambiarContrasena: cuenta.debeCambiarContrasena };
  }
}
