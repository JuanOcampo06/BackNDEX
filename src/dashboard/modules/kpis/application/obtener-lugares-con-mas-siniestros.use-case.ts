import { Franja, franjaDeHora } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { ConteoLugarHora, TableroRepositoryPort } from './tablero.repository.port';

const CANTIDAD_LUGARES = 5;

export interface LugarConMasSiniestros {
  posicion: number;
  lugar: string;
  localidad: string;
  franjaPico: Franja;
  total: number;
}

interface AcumuladoLugar {
  lugar: string;
  localidad: string;
  total: number;
  totalPorFranja: Map<Franja, number>;
}

// Los cinco lugares con mas siniestros y la franja horaria donde mas ocurren
export class ObtenerLugaresConMasSiniestrosUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<LugarConMasSiniestros[]> {
    const conteos = await this.tablero.contarSiniestrosPorLugarYHora(filtros);
    return acumularPorLugar(conteos)
      .sort((a, b) => b.total - a.total)
      .slice(0, CANTIDAD_LUGARES)
      .map((acumulado, indice) => ({
        posicion: indice + 1,
        lugar: acumulado.lugar,
        localidad: acumulado.localidad,
        franjaPico: franjaConMasCasos(acumulado.totalPorFranja),
        total: acumulado.total,
      }));
  }
}

// Junta las horas de cada lugar en su total y en sus totales por franja
function acumularPorLugar(conteos: ConteoLugarHora[]): AcumuladoLugar[] {
  const porLugar = new Map<string, AcumuladoLugar>();
  for (const conteo of conteos) {
    const acumulado = porLugar.get(conteo.lugar) ?? {
      lugar: conteo.lugar,
      localidad: conteo.localidad,
      total: 0,
      totalPorFranja: new Map<Franja, number>(),
    };
    const franja = franjaDeHora(conteo.hora);
    acumulado.total += conteo.total;
    acumulado.totalPorFranja.set(franja, (acumulado.totalPorFranja.get(franja) ?? 0) + conteo.total);
    porLugar.set(conteo.lugar, acumulado);
  }
  return [...porLugar.values()];
}

function franjaConMasCasos(totalPorFranja: Map<Franja, number>): Franja {
  const [[franjaPico]] = [...totalPorFranja.entries()].sort((a, b) => b[1] - a[1]);
  return franjaPico;
}
