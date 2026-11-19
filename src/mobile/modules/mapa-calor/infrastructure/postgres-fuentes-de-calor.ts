import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { FuentesDeCalorPort } from '../application/fuentes-de-calor.port';
import { PESO_POR_SUBCATEGORIA, ReporteCiudadano, SiniestroDelAnuario } from '../domain/mapa-calor';

// El anuario casi no cambia asi que se guarda 10 minutos en memoria
const VIGENCIA_SINIESTROS_MS = 10 * 60 * 1000;

const CONSULTA_SINIESTROS = `
  SELECT latitud, longitud, con_bicicleta AS "conBicicleta", con_muertos AS "conMuertos"
  FROM compartido.siniestros_viales`;

// Solo los tipos de reporte que pesan en el mapa y que la entidad no marco como falso positivo
const CONSULTA_REPORTES = `
  SELECT latitud, longitud, subcategoria
  FROM compartido.reportes
  WHERE creado_en >= $1 AND estado <> 'descartado' AND subcategoria = ANY($2)`;

// Lee los siniestros de la vista compartido.siniestros_viales (sale del anuario del dashboard)
// y los reportes de compartido.reportes; los reportes se leen en cada consulta para que un reporte nuevo se vea enseguida
@Injectable()
export class PostgresFuentesDeCalor implements FuentesDeCalorPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();
  private guardados: { siniestros: SiniestroDelAnuario[]; leidosEn: number } | null = null;

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async siniestros(): Promise<SiniestroDelAnuario[]> {
    if (this.guardados !== null && Date.now() - this.guardados.leidosEn < VIGENCIA_SINIESTROS_MS) {
      return this.guardados.siniestros;
    }
    const resultado = await this.pool.query<SiniestroDelAnuario>(CONSULTA_SINIESTROS);
    this.guardados = { siniestros: resultado.rows, leidosEn: Date.now() };
    return resultado.rows;
  }

  async reportesDesde(desde: Date): Promise<ReporteCiudadano[]> {
    const resultado = await this.pool.query<ReporteCiudadano>(CONSULTA_REPORTES, [desde, Object.keys(PESO_POR_SUBCATEGORIA)]);
    return resultado.rows;
  }
}
