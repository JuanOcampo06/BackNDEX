import { FiltrosTablero } from '../domain/filtros-tablero';
import { normalizarKpis } from '../domain/kpis-exportables';
import { Periodo } from '../domain/periodo';
import { GeneradorExcelPort } from './generador-excel.port';
import { armarHoja, CasosDeUsoKpi, hojaDeFiltros } from './hojas-excel-kpis';

export interface ExportarKpisCommand {
  kpis: readonly string[];
  filtros: FiltrosTablero;
}

export interface ArchivoExcel {
  nombre: string;
  contenido: Uint8Array;
}

// Arma un Excel con una hoja por cada KPI elegido y una primera hoja con los filtros usados
export class ExportarKpisUseCase {
  constructor(
    private readonly casos: CasosDeUsoKpi,
    private readonly generador: GeneradorExcelPort,
  ) {}

  async execute(comando: ExportarKpisCommand): Promise<ArchivoExcel> {
    const elegidos = normalizarKpis(comando.kpis);
    // Los nombres de las localidades se necesitan para las columnas de las hojas separadas por localidad
    const disponibles = await this.casos.filtros.execute();
    const hojasKpi = await Promise.all(
      elegidos.map((kpi) => armarHoja(kpi, this.casos, comando.filtros, disponibles.localidades)),
    );
    const hojas = [hojaDeFiltros(comando.filtros, disponibles.localidades, hojasKpi), ...hojasKpi];
    return { nombre: nombreDelArchivo(comando.filtros.periodo), contenido: await this.generador.generar({ hojas }) };
  }
}

// El nombre lleva el periodo exportado y asi no hace falta la fecha de hoy
function nombreDelArchivo(periodo: Periodo): string {
  const meses = periodo.meses();
  return `kpis_${meses[0]}_${meses[meses.length - 1]}.xlsx`;
}
