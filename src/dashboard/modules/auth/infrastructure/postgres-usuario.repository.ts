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

  buscarPorCorreo(correo: string): Promise<CuentaUsuario | null> {
    return this.buscarUna('correo = $1', correo);
  }

  buscarPorId(usuarioId: number): Promise<CuentaUsuario | null> {
    return this.buscarUna('id = $1', usuarioId);
  }

  async registrarIngreso(usuarioId: number): Promise<void> {
    await this.pool.query('UPDATE dashboard.usuarios SET ultimo_ingreso = now() WHERE id = $1', [usuarioId]);
  }

  private async buscarUna(condicion: string, valor: string | number): Promise<CuentaUsuario | null> {
    const resultado = await this.pool.query<CuentaUsuario>(
      `SELECT id, nombre_completo AS "nombreCompleto", correo, rol, entidad, contrasena_cifrada AS "contrasenaCifrada",
         debe_cambiar_contrasena AS "debeCambiarContrasena"
       FROM dashboard.usuarios WHERE ${condicion}`,
      [valor],
    );
    return resultado.rows[0] ?? null;
  }

  // La eligio el propio usuario asi que ya no tiene que cambiarla
  async cambiarContrasena(usuarioId: number, contrasenaCifrada: string): Promise<void> {
    const consulta = `UPDATE dashboard.usuarios
       SET contrasena_cifrada = $2, debe_cambiar_contrasena = false, actualizado_en = now() WHERE id = $1`;
    await this.pool.query(consulta, [usuarioId, contrasenaCifrada]);
  }
}
