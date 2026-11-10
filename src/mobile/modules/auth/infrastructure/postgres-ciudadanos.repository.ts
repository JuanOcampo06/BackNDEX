import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { CiudadanoConClave, CiudadanosRepositoryPort } from '../application/ciudadanos.repository.port';
import { Ciudadano, NuevoCiudadano } from '../domain/ciudadano';

// Columnas que se leen de la tabla con los nombres que usa el dominio
// la fecha sale como texto AAAA-MM-DD porque como Date se corre un dia segun la zona horaria
const COLUMNAS = `id, nombre_completo AS "nombreCompleto", correo, telefono, to_char(fecha_nacimiento, 'YYYY-MM-DD') AS "fechaNacimiento", genero`;

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

  async crear(ciudadano: NuevoCiudadano, contrasenaCifrada: string): Promise<Ciudadano> {
    const resultado = await this.pool.query<Ciudadano>(
      `INSERT INTO movil.usuarios (nombre_completo, correo, telefono, fecha_nacimiento, genero, contrasena_cifrada)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNAS}`,
      [ciudadano.nombreCompleto, ciudadano.correo, ciudadano.telefono, ciudadano.fechaNacimiento, ciudadano.genero, contrasenaCifrada],
    );
    return resultado.rows[0];
  }

  async buscarPorCorreo(correo: string): Promise<CiudadanoConClave | null> {
    const resultado = await this.pool.query<CiudadanoConClave>(
      `SELECT ${COLUMNAS}, contrasena_cifrada AS "contrasenaCifrada" FROM movil.usuarios WHERE correo = $1`,
      [correo],
    );
    return resultado.rows.length > 0 ? resultado.rows[0] : null;
  }
}
