import { Periodo } from '../domain/periodo';
import { ObtenerLugaresConMasSiniestrosUseCase } from './obtener-lugares-con-mas-siniestros.use-case';
import { ConteoLugarHora, TableroRepositoryPort } from './tablero.repository.port';

// Repositorio falso que solo responde los conteos por lugar y hora
function crearTablero(conteos: ConteoLugarHora[]): TableroRepositoryPort {
  const falso: Pick<TableroRepositoryPort, 'contarSiniestrosPorLugarYHora'> = {
    contarSiniestrosPorLugarYHora: async () => conteos,
  };
  return falso as TableroRepositoryPort;
}

describe('ObtenerLugaresConMasSiniestrosUseCase', () => {
  const filtros = { periodo: Periodo.desdeFiltro(new Date(2026, 9, 20)) };

  it('ordena los lugares por total y calcula la franja con mas casos', async () => {
    const tablero = crearTablero([
      { lugar: 'Calle 26 x Cra. 30', localidad: 'Teusaquillo', hora: 8, total: 4 },
      { lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 7, total: 3 },
      { lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 19, total: 5 },
      { lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 20, total: 1 },
    ]);

    const lugares = await new ObtenerLugaresConMasSiniestrosUseCase(tablero).execute(filtros);

    expect(lugares).toEqual([
      { posicion: 1, lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', franjaPico: 'noche', total: 9 },
      { posicion: 2, lugar: 'Calle 26 x Cra. 30', localidad: 'Teusaquillo', franjaPico: 'manana', total: 4 },
    ]);
  });
});
