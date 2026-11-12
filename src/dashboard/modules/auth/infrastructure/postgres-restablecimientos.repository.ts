import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearTokenAleatorio, hashDeToken } from '../../../../platform/auth';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { RestablecimientosRepositoryPort } from '../application/restablecimientos.repository.port';

// Guarda los enlaces para restablecer la contrasena en dashboard.restablecimientos_contrasena
// en la tabla solo queda el hash del token y el token real solo viaja en el correo
@Injectable()
export class PostgresRestablecimientosRepository implements RestablecimientosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async crear(usuarioId: number, venceEn: Date): Promise<string> {
    const token = crearTokenAleatorio();
    await this.pool.query(
      'INSERT INTO dashboard.restablecimientos_contrasena (usuario_id, token_hash, vence_en) VALUES ($1, $2, $3)',
      [usuarioId, hashDeToken(token), venceEn],
    );
    return token;
  }

  async consumir(token: string, ahora: Date): Promise<number | null> {
    // Un solo UPDATE revisa que siga vigente y lo marca como usado asi dos peticiones a la vez no lo usan dos veces
    const resultado = await this.pool.query<{ usuarioId: number }>(
      `UPDATE dashboard.restablecimientos_contrasena SET usado_en = $2
       WHERE token_hash = $1 AND usado_en IS NULL AND vence_en > $2
       RETURNING usuario_id AS "usuarioId"`,
      [hashDeToken(token), ahora],
    );
    const usuarioId = resultado.rows[0]?.usuarioId ?? null;
    if (usuarioId !== null) {
      // Los demas enlaces que el usuario haya pedido dejan de servir
      await this.pool.query(
        'UPDATE dashboard.restablecimientos_contrasena SET usado_en = $2 WHERE usuario_id = $1 AND usado_en IS NULL',
        [usuarioId, ahora],
      );
    }
    return usuarioId;
  }
}
