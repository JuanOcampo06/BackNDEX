import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { CicloviaRepositoryPort } from '../application/ciclovia.repository.port';
import { AreaMapa } from '../domain/area-mapa';
import { Ciclovia, TipoCiclovia } from '../domain/ciclovia';

// Postgres entrega los bigint como texto para no perder precision
interface FilaCiclovia {
  id: string;
  tipo: TipoCiclovia;
  nombre: string | null;
  riesgo: string | null;
  nodos: string[];
  coordenadas: [number, number][];
}

// Una via toca el area cuando su rectangulo se cruza con el rectangulo del mapa
const CONSULTA_POR_AREA = `
  SELECT id, tipo, nombre, riesgo, nodos, coordenadas
  FROM ciclovias
  WHERE max_lat >= $1 AND min_lat <= $2 AND max_lon >= $3 AND min_lon <= $4
    AND ($5::text IS NULL OR tipo = $5)
  ORDER BY id`;

// Adaptador que lee las ciclovias desde PostgreSQL
@Injectable()
export class PostgresCicloviaRepository implements CicloviaRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async buscarEnArea(area: AreaMapa, tipo?: TipoCiclovia): Promise<Ciclovia[]> {
    const valores = [area.minLat, area.maxLat, area.minLon, area.maxLon, tipo ?? null];
    const resultado = await this.pool.query(CONSULTA_POR_AREA, valores);
    const filas: FilaCiclovia[] = resultado.rows;
    // Los id de OpenStreetMap caben sin problema en un numero de JavaScript
    return filas.map((fila) => ({ ...fila, id: Number(fila.id), nodos: fila.nodos.map(Number) }));
  }
}
