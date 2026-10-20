import { porcentaje, sumarTotales, variacionPorcentual } from '../domain/calculos';
import { Indicador } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ConteoSemanal, TableroRepositoryPort } from './tablero.repository.port';

export interface Tarjeta {
  valor: number;
  valorPeriodoAnterior: number;
  variacionPorcentual: number | null;
  serieSemanal: ConteoSemanal[];
  porcentajeDeReportes?: number;
}

// Cifra de una tarjeta con su comparacion contra el periodo anterior y la serie de la mini grafica
export class ObtenerTarjetaUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(indicador: Indicador, filtros: FiltrosTablero): Promise<Tarjeta> {
    const filtrosAnteriores = { ...filtros, periodo: filtros.periodo.anterior() };
    const [serieSemanal, serieAnterior] = await Promise.all([
      this.tablero.contarPorSemana(indicador, filtros),
      this.tablero.contarPorSemana(indicador, filtrosAnteriores),
    ]);
    const valor = sumarTotales(serieSemanal);
    const valorPeriodoAnterior = sumarTotales(serieAnterior);
    const tarjeta = {
      valor,
      valorPeriodoAnterior,
      variacionPorcentual: variacionPorcentual(valor, valorPeriodoAnterior),
      serieSemanal,
    };
    if (indicador !== 'falsos_positivos') {
      return tarjeta;
    }
    // La tarjeta de falsos positivos tambien muestra que parte de los reportes son falsos
    const reportes = sumarTotales(await this.tablero.contarPorSemana('reportes', filtros));
    return { ...tarjeta, porcentajeDeReportes: porcentaje(valor, reportes) };
  }
}
