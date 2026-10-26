import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { FiltrosUsuarios, UsuariosRepositoryPort } from '../application/usuarios.repository.port';
import { CambiosUsuario, NuevoUsuario, Usuario } from '../domain/usuario';

// Columnas que se leen de la tabla con los nombres que usa el dominio
const COLUMNAS = `id, nombre_completo AS "nombreCompleto", correo, rol,
  creado_en AS "creadoEn", actualizado_en AS "actualizadoEn"`;

// Columna de la tabla que corresponde a cada campo que se puede cambiar
const COLUMNA_POR_CAMPO: Record<keyof CambiosUsuario, string> = {
  nombreCompleto: 'nombre_completo',
  correo: 'correo',
  rol: 'rol',
};

interface FilaUsuario extends Omit<Usuario, 'creadoEn' | 'actualizadoEn'> {
  creadoEn: Date;
  actualizadoEn: Date;
}

// La base entrega las fechas como Date y el dominio las maneja como texto ISO
function aUsuario(fila: FilaUsuario): Usuario {
  return { ...fila, creadoEn: fila.creadoEn.toISOString(), actualizadoEn: fila.actualizadoEn.toISOString() };
}

// Guarda y lee los usuarios del dashboard en la tabla usuarios_dashboard
@Injectable()
export class PostgresUsuariosRepository implements UsuariosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async listar(filtros: FiltrosUsuarios): Promise<Usuario[]> {
    const resultado = await this.pool.query<FilaUsuario>(
      `SELECT ${COLUMNAS} FROM usuarios_dashboard WHERE ($1::text IS NULL OR rol = $1) ORDER BY id`,
      [filtros.rol ?? null],
    );
    return resultado.rows.map(aUsuario);
  }

  async buscarPorId(id: number): Promise<Usuario | null> {
    const resultado = await this.pool.query<FilaUsuario>(`SELECT ${COLUMNAS} FROM usuarios_dashboard WHERE id = $1`, [id]);
    return resultado.rows.length > 0 ? aUsuario(resultado.rows[0]) : null;
  }

  async existeCorreo(correo: string, idExcluido?: number): Promise<boolean> {
    const resultado = await this.pool.query(
      'SELECT 1 FROM usuarios_dashboard WHERE correo = $1 AND ($2::int IS NULL OR id <> $2)',
      [correo, idExcluido ?? null],
    );
    return (resultado.rowCount ?? 0) > 0;
  }

  async crear(usuario: NuevoUsuario): Promise<Usuario> {
    const resultado = await this.pool.query<FilaUsuario>(
      `INSERT INTO usuarios_dashboard (nombre_completo, correo, rol) VALUES ($1, $2, $3) RETURNING ${COLUMNAS}`,
      [usuario.nombreCompleto, usuario.correo, usuario.rol],
    );
    return aUsuario(resultado.rows[0]);
  }

  async actualizar(id: number, cambios: CambiosUsuario): Promise<Usuario> {
    // Solo se escriben los campos que llegaron y los valores van como parametros
    const campos = Object.keys(cambios) as (keyof CambiosUsuario)[];
    const asignaciones = campos.map((campo, posicion) => `${COLUMNA_POR_CAMPO[campo]} = $${posicion + 2}`);
    const resultado = await this.pool.query<FilaUsuario>(
      `UPDATE usuarios_dashboard SET ${asignaciones.join(', ')}, actualizado_en = now() WHERE id = $1 RETURNING ${COLUMNAS}`,
      [id, ...campos.map((campo) => cambios[campo])],
    );
    return aUsuario(resultado.rows[0]);
  }

  async eliminar(id: number): Promise<boolean> {
    const resultado = await this.pool.query('DELETE FROM usuarios_dashboard WHERE id = $1', [id]);
    return (resultado.rowCount ?? 0) > 0;
  }
}
