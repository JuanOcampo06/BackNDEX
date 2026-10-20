import { ETIQUETAS_RANGO_EDAD, rangoDeEdad } from '../domain/calculos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { TableroRepositoryPort } from './tablero.repository.port';

export interface GrupoDeEdad {
  rango: string;
  mujer: number;
  hombre: number;
}

export interface SiniestrosPorSexoYEdad {
  totalMujer: number;
  totalHombre: number;
  rangos: GrupoDeEdad[];
}

// Victimas de siniestros agrupadas por rango de edad y sexo
export class ObtenerSiniestrosPorSexoYEdadUseCase {
  constructor(private readonly tablero: TableroRepositoryPort) {}

  async execute(filtros: FiltrosTablero): Promise<SiniestrosPorSexoYEdad> {
    const conteos = await this.tablero.contarVictimasPorSexoYEdad(filtros);
    const rangos = new Map(ETIQUETAS_RANGO_EDAD.map((rango) => [rango, { rango, mujer: 0, hombre: 0 }]));
    let totalMujer = 0;
    let totalHombre = 0;
    for (const conteo of conteos) {
      const grupo = rangos.get(rangoDeEdad(conteo.edad));
      if (!grupo) {
        continue;
      }
      if (conteo.sexo === 'mujer') {
        grupo.mujer += conteo.total;
        totalMujer += conteo.total;
      } else {
        grupo.hombre += conteo.total;
        totalHombre += conteo.total;
      }
    }
    return { totalMujer, totalHombre, rangos: [...rangos.values()] };
  }
}
