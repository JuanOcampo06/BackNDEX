import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { CriterioRuta } from './catalogos';
import { costoDe, TramoMedible } from './costos';
import { IndiceSiniestros } from './indice-siniestros';
import { IndiceTramos } from './indice-tramos';

// A cuantos metros de una ciclovia se considera que la ruta va por ella
const RADIO_PEGADO_M = 25;

// Hasta donde se cuentan los siniestros alrededor de cada trozo: la calle, sus andenes y la esquina
const RADIO_SINIESTROS_M = 60;

// Cada cuantos metros se mira por donde va la ruta
const PASO_M = 15;

// Una ruta ya trazada por calles junto a sus trozos medidos
export interface RutaMedida {
  trazado: Punto[];
  tramos: TramoMedible[];
}

// Parte la ruta en trozos de unos 15 metros y dice de cada uno si va por ciclovia, por cruce o por calle normal
// y cuantos siniestros del anuario hubo a su alrededor, vaya por donde vaya: asi la ruta segura puede esquivar las calles con mas siniestros
// el riesgo por ciclovia no se usa aqui porque sale de los mismos siniestros y se contarian dos veces
export function medirRuta(trazado: Punto[], indice: IndiceTramos, siniestros: IndiceSiniestros): RutaMedida {
  const tramos: TramoMedible[] = [];
  for (let i = 1; i < trazado.length; i++) {
    const largo = distanciaEntre(trazado[i - 1], trazado[i]);
    const trozos = Math.max(1, Math.round(largo / PASO_M));
    for (let k = 0; k < trozos; k++) {
      const fraccion = (k + 0.5) / trozos;
      const mitad = {
        latitud: trazado[i - 1].latitud + (trazado[i].latitud - trazado[i - 1].latitud) * fraccion,
        longitud: trazado[i - 1].longitud + (trazado[i].longitud - trazado[i - 1].longitud) * fraccion,
      };
      const ciclovia = indice.cercana(mitad, RADIO_PEGADO_M);
      tramos.push({
        distanciaM: largo / trozos,
        tipo: ciclovia?.tipo ?? 'conexion',
        riesgo: null,
        siniestrosCerca: siniestros.pesoCerca(mitad, RADIO_SINIESTROS_M),
      });
    }
  }
  return { trazado, tramos };
}

// Metros que mide una ruta medida
export function largoMedido(ruta: RutaMedida): number {
  return ruta.tramos.reduce((total, tramo) => total + tramo.distanciaM, 0);
}

// De varias rutas posibles para ir de un lugar a otro, la que menos cuesta con el criterio
// la segura se compara por kilometro: busca las calles mas seguras y no la ruta mas corta, que ya es la rapida
// las candidatas ya vienen limitadas a no alargar mucho el viaje
// con empate gana la primera, que es la que Google considera mejor
export function elegirMejor(criterio: CriterioRuta, candidatas: RutaMedida[]): RutaMedida {
  const costo = (ruta: RutaMedida): number => {
    const total = ruta.tramos.reduce((suma, tramo) => suma + costoDe(criterio, tramo), 0);
    return criterio === 'segura' ? total / Math.max(largoMedido(ruta), 1) : total;
  };
  return candidatas.reduce((mejor, ruta) => (costo(ruta) < costo(mejor) ? ruta : mejor));
}
