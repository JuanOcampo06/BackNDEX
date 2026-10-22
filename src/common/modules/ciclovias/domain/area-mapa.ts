import { DomainError } from '../../../../shared/domain-error';

const LATITUD_MAXIMA = 90;
const LONGITUD_MAXIMA = 180;

export interface EsquinasMapa {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
}

// Rectangulo de la parte del mapa que el usuario tiene en pantalla
export class AreaMapa {
  readonly minLat: number;
  readonly minLon: number;
  readonly maxLat: number;
  readonly maxLon: number;

  constructor(esquinas: EsquinasMapa) {
    validarRango('latitud', esquinas.minLat, esquinas.maxLat, LATITUD_MAXIMA);
    validarRango('longitud', esquinas.minLon, esquinas.maxLon, LONGITUD_MAXIMA);
    this.minLat = esquinas.minLat;
    this.minLon = esquinas.minLon;
    this.maxLat = esquinas.maxLat;
    this.maxLon = esquinas.maxLon;
  }
}

// Los dos valores deben existir en el planeta y el minimo no puede pasar al maximo
function validarRango(eje: string, minimo: number, maximo: number, limite: number): void {
  const fueraDelPlaneta = [minimo, maximo].some((valor) => !Number.isFinite(valor) || Math.abs(valor) > limite);
  if (fueraDelPlaneta) {
    throw new DomainError('AREA_INVALIDA', `La ${eje} debe estar entre -${limite} y ${limite}`);
  }
  if (minimo > maximo) {
    throw new DomainError('AREA_INVALIDA', `La ${eje} minima no puede ser mayor que la maxima`);
  }
}
