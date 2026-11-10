import { CriterioRuta, Riesgo, TipoTramo } from './catalogos';

// Lo que necesita un tramo para ponerle precio
export interface TramoMedible {
  distanciaM: number;
  tipo: TipoTramo;
  riesgo: Riesgo | null;
}

const METROS_POR_SEGUNDO_POR_KMH = 1 / 3.6;

// Velocidad estimada en bicicleta segun por donde se va: en cruce y en calle se va mas despacio que en ciclovia
const VELOCIDAD_KMH: Record<TipoTramo, number> = { ciclovia: 15, cruce: 10, conexion: 12 };

// Cuanto se encarece un metro para la ruta segura segun el tipo de tramo
// la ciclovia es lo mas seguro y cruzar una calle o ir por la calle normal es mas riesgoso
const PENALIZACION_POR_TIPO: Record<TipoTramo, number> = { ciclovia: 1, cruce: 1.3, conexion: 1.6 };

// Cuanto se encarece un metro segun el riesgo de la ciclovia
// sin dato de riesgo no se castiga nada y cuando existan los datos la ruta segura empieza a esquivar los tramos altos
const PENALIZACION_POR_RIESGO: Record<Riesgo, number> = { bajo: 1, medio: 1.6, alto: 3 };

// Metros por segundo en ciclovia: sirve para pasar los metros ponderados de la ruta segura a segundos
const METROS_POR_SEGUNDO_EN_CICLOVIA = VELOCIDAD_KMH.ciclovia * METROS_POR_SEGUNDO_POR_KMH;

// Segundos que tarda un tramo en bicicleta
export function duracionDe(tipo: TipoTramo, distanciaM: number): number {
  return distanciaM / (VELOCIDAD_KMH[tipo] * METROS_POR_SEGUNDO_POR_KMH);
}

// Metros del tramo encarecidos segun su tipo y su riesgo y es lo que cuesta un tramo en la ruta segura
function metrosPonderados(tramo: TramoMedible): number {
  const penalizacionRiesgo = tramo.riesgo === null ? 1 : PENALIZACION_POR_RIESGO[tramo.riesgo];
  return tramo.distanciaM * PENALIZACION_POR_TIPO[tramo.tipo] * penalizacionRiesgo;
}

// Precio de recorrer un tramo y la ruta elegida es la de menor precio total
// rapida cobra segundos y segura cobra metros ponderados por tipo de tramo y por riesgo
// equilibrada cobra el promedio de las dos, con la segura pasada a segundos, y por eso queda entre las dos
export function costoDe(criterio: CriterioRuta, tramo: TramoMedible): number {
  if (criterio === 'rapida') {
    return duracionDe(tramo.tipo, tramo.distanciaM);
  }
  if (criterio === 'segura') {
    return metrosPonderados(tramo);
  }
  return (duracionDe(tramo.tipo, tramo.distanciaM) + metrosPonderados(tramo) / METROS_POR_SEGUNDO_EN_CICLOVIA) / 2;
}
