import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { SiniestrosRepositoryPort } from '../application/siniestros.repository.port';
import { SiniestroUbicado } from '../domain/indice-siniestros';

// Cada cuanto se vuelven a leer los siniestros para que un anuario nuevo llegue a las rutas sin reiniciar la api
const VIGENCIA_MS = 10 * 60 * 1000;

// Lee los siniestros del anuario desde la vista compartido.siniestros_viales (la tabla es del tablero)
// son unos 11.500 y se guardan en memoria para no consultarlos en cada peticion
@Injectable()
export class PostgresSiniestrosRepository implements SiniestrosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();
  private guardado: { siniestros: SiniestroUbicado[]; venceEn: number } | null = null;
  // Si llegan varias peticiones a la vez con la memoria vacia todas esperan la misma lectura
  private lectura: Promise<SiniestroUbicado[]> | null = null;

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async obtenerSiniestros(): Promise<SiniestroUbicado[]> {
    if (this.guardado !== null && Date.now() < this.guardado.venceEn) {
      return this.guardado.siniestros;
    }
    this.lectura ??= this.leer().finally(() => {
      this.lectura = null;
    });
    return this.lectura;
  }

  private async leer(): Promise<SiniestroUbicado[]> {
    const resultado = await this.pool.query<SiniestroUbicado>(
      'SELECT latitud, longitud, con_bicicleta AS "conBicicleta", con_muertos AS "conMuertos" FROM compartido.siniestros_viales',
    );
    this.guardado = { siniestros: resultado.rows, venceEn: Date.now() + VIGENCIA_MS };
    return resultado.rows;
  }
}
