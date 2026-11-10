import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { RedCicloviasRepositoryPort } from '../application/red-ciclovias.repository.port';
import { ViaCiclista } from '../domain/via-ciclista';

// Cada cuanto se vuelven a leer las ciclovias para que los riesgos nuevos lleguen a las rutas sin reiniciar la api
const VIGENCIA_MS = 10 * 60 * 1000;

// Postgres entrega los bigint como texto para no perder precision
interface FilaVia {
  id: string;
  tipo: ViaCiclista['tipo'];
  riesgo: string | null;
  nodos: string[];
  coordenadas: [number, number][];
}

// Lee de compartido.ciclovias todas las vias porque una ruta puede cruzar toda la ciudad
// la red es pequena y por eso se guarda en memoria y no se consulta en cada peticion
@Injectable()
export class PostgresRedCicloviasRepository implements RedCicloviasRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();
  private guardado: { vias: ViaCiclista[]; venceEn: number } | null = null;
  // Si llegan varias peticiones a la vez con la memoria vacia todas esperan la misma lectura
  private lectura: Promise<ViaCiclista[]> | null = null;

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async obtenerVias(): Promise<ViaCiclista[]> {
    if (this.guardado !== null && Date.now() < this.guardado.venceEn) {
      return this.guardado.vias;
    }
    this.lectura ??= this.leer().finally(() => {
      this.lectura = null;
    });
    return this.lectura;
  }

  private async leer(): Promise<ViaCiclista[]> {
    const resultado = await this.pool.query<FilaVia>('SELECT id, tipo, riesgo, nodos, coordenadas FROM compartido.ciclovias ORDER BY id');
    // Los id de OpenStreetMap caben sin problema en un numero de JavaScript
    const vias = resultado.rows.map((fila) => ({ ...fila, id: Number(fila.id), nodos: fila.nodos.map(Number) }));
    this.guardado = { vias, venceEn: Date.now() + VIGENCIA_MS };
    return vias;
  }
}
