import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { FiltrosSos, SosRepositoryPort } from '../application/sos.repository.port';
import { ActivacionSos, NuevaActivacionSos } from '../domain/activacion-sos';
import { EstadoSos } from '../domain/catalogos';

const LIMITE_LISTADO = 100;

// Columnas que se leen de la tabla con los nombres que usa el dominio
const COLUMNAS = `id, usuario_id AS "usuarioId", tipo_vehiculo AS "tipoVehiculo", latitud, longitud, estado, activado_en AS "activadoEn"`;

interface FilaSos extends Omit<ActivacionSos, 'activadoEn'> {
  activadoEn: Date;
}

// La base entrega la fecha como Date y el dominio la maneja como texto ISO
function aActivacion(fila: FilaSos): ActivacionSos {
  return { ...fila, activadoEn: fila.activadoEn.toISOString() };
}

// Guarda y lee las activaciones en la tabla maestra compartido.activaciones_panico que tambien lee el dashboard
// los ciudadanos autores estan en movil.usuarios porque solo los usa la app
@Injectable()
export class PostgresSosRepository implements SosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async existeUsuario(usuarioId: number): Promise<boolean> {
    const resultado = await this.pool.query('SELECT 1 FROM movil.usuarios WHERE id = $1', [usuarioId]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async guardar(activacion: NuevaActivacionSos): Promise<ActivacionSos> {
    // El dashboard agrupa las activaciones por lugar asi que se guarda el lugar conocido mas cercano a las coordenadas
    const resultado = await this.pool.query<FilaSos>(
      `INSERT INTO compartido.activaciones_panico (usuario_id, tipo_vehiculo, latitud, longitud, lugar_id)
       VALUES ($1, $2, $3, $4, compartido.lugar_mas_cercano($3, $4))
       RETURNING ${COLUMNAS}`,
      [activacion.usuarioId, activacion.tipoVehiculo, activacion.latitud, activacion.longitud],
    );
    return aActivacion(resultado.rows[0]);
  }

  async listar(filtros: FiltrosSos): Promise<ActivacionSos[]> {
    // Los valores van como parametros para no pegar texto del usuario dentro del SQL
    const condiciones: string[] = [];
    const valores: unknown[] = [];
    if (filtros.usuarioId !== undefined) {
      valores.push(filtros.usuarioId);
      condiciones.push(`usuario_id = $${valores.length}`);
    }
    if (filtros.estado !== undefined) {
      valores.push(filtros.estado);
      condiciones.push(`estado = $${valores.length}`);
    }
    const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await this.pool.query<FilaSos>(
      `SELECT ${COLUMNAS} FROM compartido.activaciones_panico ${donde} ORDER BY activado_en DESC, id DESC LIMIT ${LIMITE_LISTADO}`,
      valores,
    );
    return resultado.rows.map(aActivacion);
  }

  async buscarPorId(id: number): Promise<ActivacionSos | null> {
    const resultado = await this.pool.query<FilaSos>(`SELECT ${COLUMNAS} FROM compartido.activaciones_panico WHERE id = $1`, [id]);
    return resultado.rows.length > 0 ? aActivacion(resultado.rows[0]) : null;
  }

  async cambiarEstado(id: number, estado: EstadoSos): Promise<ActivacionSos> {
    const resultado = await this.pool.query<FilaSos>(
      `UPDATE compartido.activaciones_panico SET estado = $2 WHERE id = $1 RETURNING ${COLUMNAS}`,
      [id, estado],
    );
    return aActivacion(resultado.rows[0]);
  }
}
