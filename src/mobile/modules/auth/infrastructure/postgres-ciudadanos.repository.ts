import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { CiudadanoConClave, CiudadanosRepositoryPort } from '../application/ciudadanos.repository.port';
import { Ciudadano, NuevoCiudadano } from '../domain/ciudadano';
import { AceptacionTerminos } from '../domain/terminos';

// Columnas que se leen de la tabla con los nombres que usa el dominio
// la fecha sale como texto AAAA-MM-DD porque como Date se corre un dia segun la zona horaria
const COLUMNAS = `id, nombre_completo AS "nombreCompleto", correo, to_char(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento", genero`;

// Guarda y lee los ciudadanos de la app movil en movil.usuarios
@Injectable()
export class PostgresCiudadanosRepository implements CiudadanosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async existeCorreo(correo: string): Promise<boolean> {
    const resultado = await this.pool.query('SELECT 1 FROM movil.usuarios WHERE correo = $1', [correo]);
    return (resultado.rowCount ?? 0) > 0;
  }

  // El ciudadano y su aceptacion de los terminos se guardan juntos para que no quede una cuenta sin su constancia
  async crear(ciudadano: NuevoCiudadano, contrasenaCifrada: string, aceptacion: AceptacionTerminos): Promise<Ciudadano> {
    const conexion = await this.pool.connect();
    try {
      await conexion.query('BEGIN');
      const resultado = await conexion.query<Ciudadano>(
        `INSERT INTO movil.usuarios (nombre_completo, correo, fecha_nacimiento, genero, contrasena_cifrada, acepto_terminos)
         VALUES ($1, $2, $3, $4, $5, true)
         RETURNING ${COLUMNAS}`,
        [ciudadano.nombreCompleto, ciudadano.correo, ciudadano.fechaNacimiento, ciudadano.genero, contrasenaCifrada],
      );
      const guardado = resultado.rows[0];
      await conexion.query('INSERT INTO movil.aceptaciones_terminos (usuario_id, version_terminos, aceptado_en) VALUES ($1, $2, $3)', [
        guardado.id,
        aceptacion.version,
        aceptacion.aceptadoEn,
      ]);
      await conexion.query('COMMIT');
      return guardado;
    } catch (error) {
      await conexion.query('ROLLBACK');
      throw error;
    } finally {
      conexion.release();
    }
  }

  async buscarPorCorreo(correo: string): Promise<CiudadanoConClave | null> {
    const resultado = await this.pool.query<CiudadanoConClave>(
      `SELECT ${COLUMNAS}, contrasena_cifrada AS "contrasenaCifrada", correo_verificado AS "correoVerificado" FROM movil.usuarios WHERE correo = $1`,
      [correo],
    );
    return resultado.rows.length > 0 ? resultado.rows[0] : null;
  }

  async cambiarContrasena(id: number, contrasenaCifrada: string): Promise<void> {
    await this.pool.query('UPDATE movil.usuarios SET contrasena_cifrada = $2 WHERE id = $1', [id, contrasenaCifrada]);
  }

  async marcarCorreoVerificado(id: number): Promise<void> {
    await this.pool.query('UPDATE movil.usuarios SET correo_verificado = true WHERE id = $1', [id]);
  }
}
