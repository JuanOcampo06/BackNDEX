import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { hashDeToken } from '../../../../platform/auth';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { ContactosRepositoryPort, Invitacion, NuevoContacto } from '../application/contactos.repository.port';
import { ContactoEmergencia, EstadoContacto } from '../domain/contacto';

const COLUMNAS = 'id, nombre, parentesco, telefono, correo, estado, color';

// 32 bytes al azar: el enlace no se puede adivinar
const BYTES_DEL_TOKEN = 32;

// El contacto nuevo va al final de la lista y solo se guarda si el ciudadano existe
const CREAR = `
  INSERT INTO movil.contactos_emergencia (usuario_id, nombre, parentesco, telefono, correo, estado, color, orden)
  SELECT $1, $2, $3, $4, $5, $6, $7,
    (SELECT coalesce(max(orden) + 1, 0) FROM movil.contactos_emergencia WHERE usuario_id = $1)
  WHERE EXISTS (SELECT 1 FROM movil.usuarios WHERE id = $1)
  RETURNING ${COLUMNAS}`;

const BUSCAR_INVITACION = `
  SELECT c.id AS "contactoId", u.nombre_completo AS ciudadano, c.nombre AS contacto, c.estado, c.invitacion_vence_en AS "venceEn"
  FROM movil.contactos_emergencia c
  JOIN movil.usuarios u ON u.id = c.usuario_id
  WHERE c.invitacion_hash = $1`;

// Guarda y lee los contactos de emergencia de cada ciudadano y sus invitaciones en movil.contactos_emergencia
// cada consulta del ciudadano filtra por usuario_id para que nadie lea ni cambie contactos ajenos
// del enlace de la invitacion solo se guarda el hash, el enlace real solo viaja en el correo
@Injectable()
export class PostgresContactosRepository implements ContactosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async listar(usuarioId: number): Promise<ContactoEmergencia[]> {
    const resultado = await this.pool.query<ContactoEmergencia>(
      `SELECT ${COLUMNAS} FROM movil.contactos_emergencia WHERE usuario_id = $1 ORDER BY orden, id`,
      [usuarioId],
    );
    return resultado.rows;
  }

  async crear(usuarioId: number, c: NuevoContacto): Promise<ContactoEmergencia | null> {
    const resultado = await this.pool.query<ContactoEmergencia>(CREAR, [usuarioId, c.nombre, c.parentesco, c.telefono, c.correo, c.estado, c.color]);
    return resultado.rows[0] ?? null;
  }

  async actualizar(usuarioId: number, c: ContactoEmergencia): Promise<void> {
    await this.pool.query(
      `UPDATE movil.contactos_emergencia SET nombre = $3, parentesco = $4, telefono = $5, correo = $6, estado = $7
       WHERE id = $1 AND usuario_id = $2`,
      [c.id, usuarioId, c.nombre, c.parentesco, c.telefono, c.correo, c.estado],
    );
  }

  async eliminar(usuarioId: number, contactoId: number): Promise<boolean> {
    const resultado = await this.pool.query('DELETE FROM movil.contactos_emergencia WHERE id = $1 AND usuario_id = $2', [contactoId, usuarioId]);
    return (resultado.rowCount ?? 0) > 0;
  }

  // La posicion de cada id en la lista es su orden nuevo
  async ordenar(usuarioId: number, ids: number[]): Promise<void> {
    await this.pool.query(
      `UPDATE movil.contactos_emergencia AS c SET orden = nuevo.posicion
       FROM unnest($2::int[]) WITH ORDINALITY AS nuevo(id, posicion)
       WHERE c.id = nuevo.id AND c.usuario_id = $1`,
      [usuarioId, ids],
    );
  }

  async nombreDelCiudadano(usuarioId: number): Promise<string | null> {
    const resultado = await this.pool.query<{ nombre: string }>('SELECT nombre_completo AS nombre FROM movil.usuarios WHERE id = $1', [usuarioId]);
    return resultado.rows[0]?.nombre ?? null;
  }

  async nuevaInvitacion(contactoId: number, fechas: { enviadaEn: Date; venceEn: Date }): Promise<string> {
    const token = randomBytes(BYTES_DEL_TOKEN).toString('base64url');
    await this.pool.query(
      `UPDATE movil.contactos_emergencia
       SET invitacion_hash = $2, invitacion_enviada_en = $3, invitacion_vence_en = $4, respondido_en = NULL
       WHERE id = $1`,
      [contactoId, hashDeToken(token), fechas.enviadaEn, fechas.venceEn],
    );
    return token;
  }

  async invitacionEnviadaEn(usuarioId: number, contactoId: number): Promise<Date | null> {
    const resultado = await this.pool.query<{ enviadaEn: Date | null }>(
      'SELECT invitacion_enviada_en AS "enviadaEn" FROM movil.contactos_emergencia WHERE id = $1 AND usuario_id = $2',
      [contactoId, usuarioId],
    );
    return resultado.rows[0]?.enviadaEn ?? null;
  }

  async buscarInvitacion(token: string): Promise<Invitacion | null> {
    const resultado = await this.pool.query<Invitacion>(BUSCAR_INVITACION, [hashDeToken(token)]);
    return resultado.rows[0] ?? null;
  }

  async responderInvitacion(contactoId: number, estado: EstadoContacto, respondidoEn: Date): Promise<void> {
    await this.pool.query(
      'UPDATE movil.contactos_emergencia SET estado = $2, respondido_en = $3, invitacion_hash = NULL WHERE id = $1',
      [contactoId, estado, respondidoEn],
    );
  }
}
