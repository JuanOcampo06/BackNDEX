import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { hashDeToken } from '../../../../platform/auth';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { CodigosRepositoryPort } from '../application/codigos.repository.port';

// Tablas donde se guardan los codigos y las dos tienen las mismas columnas
// el nombre nunca viene de afuera: solo se pasa una de estas constantes
export const TABLA_RESTABLECIMIENTOS = 'movil.restablecimientos_contrasena';
export const TABLA_VERIFICACIONES = 'movil.verificaciones_correo';

// El codigo son cuatro digitos (diez mil posibilidades) y como solo se puede probar 5 veces adivinarlo es muy dificil
const LIMITE_DEL_CODIGO = 10_000;
const DIGITOS_DEL_CODIGO = 4;

// Despues de estos codigos equivocados el codigo pedido deja de servir y hay que pedir otro
const MAXIMO_INTENTOS = 5;

// Guarda los codigos de un solo uso en la tabla que se le indique
// en la tabla solo queda el hash del codigo y el codigo real solo viaja en el correo
@Injectable()
export class PostgresCodigosRepository implements CodigosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  constructor(private readonly tabla: string) {}

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async crear(usuarioId: number, ahora: Date, venceEn: Date): Promise<string> {
    await this.invalidarPendientes(usuarioId, ahora);
    const codigo = String(randomInt(LIMITE_DEL_CODIGO)).padStart(DIGITOS_DEL_CODIGO, '0');
    await this.pool.query(`INSERT INTO ${this.tabla} (usuario_id, codigo_hash, vence_en, creado_en) VALUES ($1, $2, $3, $4)`, [
      usuarioId,
      hashDelCodigo(usuarioId, codigo),
      venceEn,
      ahora,
    ]);
    return codigo;
  }

  async haySolicitudDesde(usuarioId: number, desde: Date): Promise<boolean> {
    const resultado = await this.pool.query(`SELECT 1 FROM ${this.tabla} WHERE usuario_id = $1 AND creado_en > $2`, [usuarioId, desde]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async consumir(usuarioId: number, codigo: string, ahora: Date): Promise<boolean> {
    // Un solo UPDATE revisa que siga vigente y lo marca como usado asi dos peticiones a la vez no lo usan dos veces
    const resultado = await this.pool.query(
      `UPDATE ${this.tabla} SET usado_en = $3
       WHERE usuario_id = $1 AND codigo_hash = $2 AND usado_en IS NULL AND vence_en > $3 AND intentos < $4`,
      [usuarioId, hashDelCodigo(usuarioId, codigo), ahora, MAXIMO_INTENTOS],
    );
    if ((resultado.rowCount ?? 0) > 0) {
      return true;
    }
    await this.pool.query(`UPDATE ${this.tabla} SET intentos = intentos + 1 WHERE usuario_id = $1 AND usado_en IS NULL AND vence_en > $2`, [
      usuarioId,
      ahora,
    ]);
    return false;
  }

  // Los codigos anteriores del ciudadano dejan de servir
  private async invalidarPendientes(usuarioId: number, ahora: Date): Promise<void> {
    await this.pool.query(`UPDATE ${this.tabla} SET usado_en = $2 WHERE usuario_id = $1 AND usado_en IS NULL`, [usuarioId, ahora]);
  }
}

// El hash lleva el ciudadano para que un mismo codigo de dos ciudadanos no se parezca en la tabla
function hashDelCodigo(usuarioId: number, codigo: string): string {
  return hashDeToken(`${usuarioId}:${codigo}`);
}
