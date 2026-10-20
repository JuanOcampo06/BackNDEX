import { Indicador } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { Periodo } from '../domain/periodo';
import { ObtenerTarjetaUseCase } from './obtener-tarjeta.use-case';
import { ConteoSemanal, TableroRepositoryPort } from './tablero.repository.port';

// Repositorio falso que solo responde la serie semanal segun el indicador y el mes inicial pedido
function crearTablero(series: Record<string, ConteoSemanal[]>): TableroRepositoryPort {
  const falso: Pick<TableroRepositoryPort, 'contarPorSemana'> = {
    contarPorSemana: async (indicador: Indicador, filtros: FiltrosTablero) =>
      series[`${indicador} ${filtros.periodo.fechaInicio()}`] ?? [],
  };
  return falso as TableroRepositoryPort;
}

describe('ObtenerTarjetaUseCase', () => {
  const filtros = { periodo: Periodo.desdeFiltro(new Date(2026, 9, 20)) };

  it('suma la serie y la compara con el periodo anterior', async () => {
    const tablero = crearTablero({
      'siniestros 2026-08-01': [
        { semana: '2026-08-03', total: 60 },
        { semana: '2026-08-10', total: 50 },
      ],
      'siniestros 2026-05-01': [{ semana: '2026-05-04', total: 100 }],
    });

    const tarjeta = await new ObtenerTarjetaUseCase(tablero).execute('siniestros', filtros);

    expect(tarjeta.valor).toBe(110);
    expect(tarjeta.valorPeriodoAnterior).toBe(100);
    expect(tarjeta.variacionPorcentual).toBe(10);
    expect(tarjeta.porcentajeDeReportes).toBeUndefined();
  });

  it('en falsos positivos agrega el porcentaje sobre los reportes', async () => {
    const tablero = crearTablero({
      'falsos_positivos 2026-08-01': [{ semana: '2026-08-03', total: 8 }],
      'reportes 2026-08-01': [{ semana: '2026-08-03', total: 100 }],
    });

    const tarjeta = await new ObtenerTarjetaUseCase(tablero).execute('falsos_positivos', filtros);

    expect(tarjeta.variacionPorcentual).toBeNull();
    expect(tarjeta.porcentajeDeReportes).toBe(8);
  });
});
