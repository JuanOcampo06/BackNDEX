import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import {
  FiltrosReportes,
  ReportesRepositoryPort,
} from '../application/reportes.repository.port';
import { NuevoReporte, Reporte } from '../domain/reporte';

const LIMITE_LISTADO = 100;

// Columnas que se leen de la tabla con los nombres que usa el dominio
const COLUMNAS = `id, usuario_id AS "usuarioId", categoria, descripcion, latitud, longitud, estado, creado_en AS "creadoEn"`;

interface FilaReporte extends Omit<Reporte, 'creadoEn'> {
  creadoEn: Date;
}

// La base entrega la fecha como Date y el dominio la maneja como texto ISO
function aReporte(fila: FilaReporte): Reporte {
  return { ...fila, creadoEn: fila.creadoEn.toISOString() };
}

// Guarda y lee los reportes de la app movil en la base safepath
// sus tablas estan en el schema movil para no chocar con la tabla reportes del dashboard
@Injectable()
export class PostgresReportesRepository implements ReportesRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async existeUsuario(usuarioId: number): Promise<boolean> {
    const resultado = await this.pool.query('SELECT 1 FROM movil.usuarios WHERE id = $1', [usuarioId]);
    return (resultado.rowCount ?? 0) > 0;
  }

  async guardar(reporte: NuevoReporte): Promise<Reporte> {
    const resultado = await this.pool.query<FilaReporte>(
      `INSERT INTO movil.reportes (usuario_id, categoria, descripcion, latitud, longitud)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${COLUMNAS}`,
      [reporte.usuarioId, reporte.categoria, reporte.descripcion, reporte.latitud, reporte.longitud],
    );
    return aReporte(resultado.rows[0]);
  }

  async listar(filtros: FiltrosReportes): Promise<Reporte[]> {
    // Los valores van como parametros para no pegar texto del usuario dentro del SQL
    const condiciones: string[] = [];
    const valores: unknown[] = [];
    if (filtros.usuarioId !== undefined) {
      valores.push(filtros.usuarioId);
      condiciones.push(`usuario_id = $${valores.length}`);
    }
    if (filtros.categoria !== undefined) {
      valores.push(filtros.categoria);
      condiciones.push(`categoria = $${valores.length}`);
    }
    const donde = condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '';
    const resultado = await this.pool.query<FilaReporte>(
      `SELECT ${COLUMNAS} FROM movil.reportes ${donde} ORDER BY creado_en DESC, id DESC LIMIT ${LIMITE_LISTADO}`,
      valores,
    );
    return resultado.rows.map(aReporte);
  }

  async buscarPorId(id: number): Promise<Reporte | null> {
    const resultado = await this.pool.query<FilaReporte>(`SELECT ${COLUMNAS} FROM movil.reportes WHERE id = $1`, [id]);
    return resultado.rows.length > 0 ? aReporte(resultado.rows[0]) : null;
  }
}
