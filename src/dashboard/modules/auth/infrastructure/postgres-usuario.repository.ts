import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { UsuarioRepositoryPort } from '../application/usuario.repository.port';
import { CuentaUsuario } from '../domain/usuario';

// Lee las cuentas de la tabla dashboard.usuarios que tambien administra el modulo users
// asi un usuario creado desde el tablero puede iniciar sesion
@Injectable()
export class PostgresUsuarioRepository implements UsuarioRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async buscarPorCorreo(correo: string): Promise<CuentaUsuario | null> {
    const resultado = await this.pool.query<CuentaUsuario>(
      `SELECT id, nombre_completo AS "nombreCompleto", correo, rol, contrasena_cifrada AS "contrasenaCifrada"
       FROM dashboard.usuarios WHERE correo = $1`,
      [correo],
    );
    return resultado.rows[0] ?? null;
  }

  async cambiarContrasena(usuarioId: number, contrasenaCifrada: string): Promise<void> {
    await this.pool.query('UPDATE dashboard.usuarios SET contrasena_cifrada = $2, actualizado_en = now() WHERE id = $1', [
      usuarioId,
      contrasenaCifrada,
    ]);
  }
}
