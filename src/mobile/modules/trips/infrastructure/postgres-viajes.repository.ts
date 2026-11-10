import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { ViajesRepositoryPort } from '../application/viajes.repository.port';
import { NuevoViaje, PuntoViaje, Ubicacion, Viaje, ViajeConPuntos } from '../domain/viaje';
import { ViajeEnCursoDuplicadoError } from '../domain/viaje-en-curso-duplicado.error';

const LIMITE_LISTADO = 100;
// Codigo de PostgreSQL cuando se rompe un indice unico
const VIOLACION_UNICA = '23505';

// Columnas que se leen de la tabla con los nombres que usa el dominio
const COLUMNAS = `id, usuario_id AS "usuarioId", estado, distancia_m AS "distanciaM", iniciado_en AS "iniciadoEn", finalizado_en AS "finalizadoEn"`;

interface FilaViaje extends Omit<Viaje, 'iniciadoEn' | 'finalizadoEn'> {
  iniciadoEn: Date;
  finalizadoEn: Date | null;
}

interface FilaPunto extends Omit<PuntoViaje, 'registradoEn'> {
  registradoEn: Date;
}

// La base entrega las fechas como Date y el dominio las maneja como texto ISO
function aViaje(fila: FilaViaje): Viaje {
  return { ...fila, iniciadoEn: fila.iniciadoEn.toISOString(), finalizadoEn: fila.finalizadoEn?.toISOString() ?? null };
}

function aPunto(fila: FilaPunto): PuntoViaje {
  return { ...fila, registradoEn: fila.registradoEn.toISOString() };
}

// Guarda y lee los viajes de la app movil en la base safepath
// sus tablas estan en el schema movil junto a los ciudadanos
@Injectable()
export class PostgresViajesRepository implements ViajesRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async buscarEnCurso(usuarioId: number): Promise<Viaje | null> {
    const resultado = await this.pool.query<FilaViaje>(
      `SELECT ${COLUMNAS} FROM movil.viajes WHERE usuario_id = $1 AND estado = 'en_curso'`,
      [usuarioId],
    );
    return resultado.rows.length > 0 ? aViaje(resultado.rows[0]) : null;
  }

  // El viaje y su primer punto se guardan juntos o no se guarda ninguno
  async iniciar(viaje: NuevoViaje): Promise<Viaje> {
    const conexion = await this.pool.connect();
    try {
      await conexion.query('BEGIN');
      const resultado = await conexion.query<FilaViaje>(`INSERT INTO movil.viajes (usuario_id) VALUES ($1) RETURNING ${COLUMNAS}`, [
        viaje.usuarioId,
      ]);
      await conexion.query('INSERT INTO movil.puntos_viaje (viaje_id, latitud, longitud) VALUES ($1, $2, $3)', [
        resultado.rows[0].id,
        viaje.latitud,
        viaje.longitud,
      ]);
      await conexion.query('COMMIT');
      return aViaje(resultado.rows[0]);
    } catch (error) {
      await conexion.query('ROLLBACK');
      return await this.traducirError(error, viaje.usuarioId);
    } finally {
      conexion.release();
    }
  }

  async buscarPorId(id: number): Promise<ViajeConPuntos | null> {
    const viaje = await this.pool.query<FilaViaje>(`SELECT ${COLUMNAS} FROM movil.viajes WHERE id = $1`, [id]);
    if (viaje.rows.length === 0) {
      return null;
    }
    const puntos = await this.pool.query<FilaPunto>(
      'SELECT latitud, longitud, registrado_en AS "registradoEn" FROM movil.puntos_viaje WHERE viaje_id = $1 ORDER BY registrado_en, id',
      [id],
    );
    return { ...aViaje(viaje.rows[0]), puntos: puntos.rows.map(aPunto) };
  }

  async agregarPunto(viajeId: number, ubicacion: Ubicacion): Promise<PuntoViaje> {
    const resultado = await this.pool.query<FilaPunto>(
      `INSERT INTO movil.puntos_viaje (viaje_id, latitud, longitud)
       VALUES ($1, $2, $3)
       RETURNING latitud, longitud, registrado_en AS "registradoEn"`,
      [viajeId, ubicacion.latitud, ubicacion.longitud],
    );
    return aPunto(resultado.rows[0]);
  }

  async finalizar(id: number, distanciaM: number): Promise<Viaje> {
    const resultado = await this.pool.query<FilaViaje>(
      `UPDATE movil.viajes SET estado = 'finalizado', distancia_m = $2, finalizado_en = now() WHERE id = $1 RETURNING ${COLUMNAS}`,
      [id, distanciaM],
    );
    return aViaje(resultado.rows[0]);
  }

  async listar(usuarioId: number): Promise<Viaje[]> {
    const resultado = await this.pool.query<FilaViaje>(
      `SELECT ${COLUMNAS} FROM movil.viajes WHERE usuario_id = $1 ORDER BY iniciado_en DESC, id DESC LIMIT ${LIMITE_LISTADO}`,
      [usuarioId],
    );
    return resultado.rows.map(aViaje);
  }

  // Si dos peticiones llegan a la vez el indice unico de la base deja pasar solo una
  private async traducirError(error: unknown, usuarioId: number): Promise<never> {
    if ((error as { code?: string }).code === VIOLACION_UNICA) {
      const abierto = await this.buscarEnCurso(usuarioId);
      throw new ViajeEnCursoDuplicadoError(abierto?.id ?? 0);
    }
    throw error;
  }
}
