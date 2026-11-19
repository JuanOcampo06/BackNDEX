import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { SemaforosRepositoryPort } from '../application/semaforos.repository.port';
import { AreaMapa } from '../domain/area-mapa';
import { Semaforo } from '../domain/semaforo';

// Postgres entrega el bigint como texto para no perder precision
interface FilaSemaforo extends Omit<Semaforo, 'id'> {
  id: string;
}

const CONSULTA_POR_AREA = `
  SELECT id, latitud, longitud
  FROM movil.semaforos
  WHERE latitud BETWEEN $1 AND $2 AND longitud BETWEEN $3 AND $4
  ORDER BY id`;

// Lee los semaforos de las ciclorrutas desde movil.semaforos
@Injectable()
export class PostgresSemaforosRepository implements SemaforosRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async buscarEnArea(area: AreaMapa): Promise<Semaforo[]> {
    const resultado = await this.pool.query<FilaSemaforo>(CONSULTA_POR_AREA, [area.minLat, area.maxLat, area.minLon, area.maxLon]);
    // Los id de OpenStreetMap caben sin problema en un numero de JavaScript
    return resultado.rows.map((fila) => ({ ...fila, id: Number(fila.id) }));
  }
}
