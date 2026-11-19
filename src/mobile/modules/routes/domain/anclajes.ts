import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { IndiceSiniestros } from './indice-siniestros';
import { IndiceTramos } from './indice-tramos';
import { largoDe } from './largo';

// Hasta donde se busca una ciclovia para desviarse hacia ella desde un punto del camino
const RADIO_BUSQUEDA_M = 500;

// Un anclaje demasiado cerca del origen o del destino no cambia el camino
const DISTANCIA_MINIMA_A_LOS_EXTREMOS_M = 300;

// Tamano de la lista de anclajes que se prueban
const MAXIMO_JUEGOS = 2;

// Puntos de ciclovia por los que se le puede pedir al servicio de mapas que pase para tener una ruta que aproveche mas las ciclovias
// devuelve hasta dos juegos de puntos: uno que pasa por una ciclovia cerca de la mitad del camino y otro que pasa por dos cerca del primer y el segundo tercio
// los puntos salen de ciclovias de riesgo bajo o medio cercanas al camino y asi el desvio es pequeno
export function anclajesDe(camino: Punto[], indice: IndiceTramos): Punto[][] {
  const total = largoDe(camino);
  const origen = camino[0];
  const destino = camino[camino.length - 1];
  const buscar = (fraccion: number): Punto | null => {
    const ancla = indice.anclajeCercano(puntoA(camino, total * fraccion), RADIO_BUSQUEDA_M);
    const sirve = ancla !== null && distanciaEntre(ancla, origen) >= DISTANCIA_MINIMA_A_LOS_EXTREMOS_M && distanciaEntre(ancla, destino) >= DISTANCIA_MINIMA_A_LOS_EXTREMOS_M;
    return sirve ? ancla : null;
  };
  const mitad = buscar(0.5);
  const primero = buscar(1 / 3);
  const segundo = buscar(2 / 3);
  const juegos: Punto[][] = [];
  if (mitad !== null) {
    juegos.push([mitad]);
  }
  if (primero !== null && segundo !== null && distanciaEntre(primero, segundo) > DISTANCIA_MINIMA_A_LOS_EXTREMOS_M) {
    juegos.push([primero, segundo]);
  }
  return juegos.slice(0, MAXIMO_JUEGOS);
}

// Distancias a cada lado del camino donde se buscan calles paralelas con menos siniestros
const DESPLAZAMIENTOS_LATERALES_M = [-500, -250, 250, 500];

// Hasta donde se cuentan los siniestros alrededor de un punto para comparar una calle con otra
const RADIO_COMPARACION_M = 150;

// Metros a cada lado del punto medio para saber hacia donde va el camino
const PASO_RUMBO_M = 50;

const METROS_POR_GRADO = 110_800;

// Puntos de calles paralelas al camino por donde hubo menos siniestros que por el propio camino
// se miran puntos a 250 y 500 metros a cada lado de la mitad del camino y se devuelven hasta dos, los de menos siniestros
// cada punto es un juego por si solo: el servicio de mapas traza un camino que pasa por el
export function anclajesSegurosDe(camino: Punto[], siniestros: IndiceSiniestros): Punto[][] {
  const total = largoDe(camino);
  const mitad = puntoA(camino, total / 2);
  const antes = puntoA(camino, Math.max(0, total / 2 - PASO_RUMBO_M));
  const despues = puntoA(camino, Math.min(total, total / 2 + PASO_RUMBO_M));
  const dx = (despues.longitud - antes.longitud) * METROS_POR_GRADO;
  const dy = (despues.latitud - antes.latitud) * METROS_POR_GRADO;
  const largo = Math.hypot(dx, dy);
  if (largo === 0) {
    return [];
  }
  // Direccion perpendicular al camino, en metros
  const [px, py] = [-dy / largo, dx / largo];
  const enElCamino = siniestros.pesoCerca(mitad, RADIO_COMPARACION_M);
  const laterales = DESPLAZAMIENTOS_LATERALES_M.map((metros) => {
    const punto = { latitud: mitad.latitud + (py * metros) / METROS_POR_GRADO, longitud: mitad.longitud + (px * metros) / METROS_POR_GRADO };
    return { punto, peso: siniestros.pesoCerca(punto, RADIO_COMPARACION_M) };
  });
  return laterales
    .filter(({ peso }) => peso < enElCamino)
    .sort((a, b) => a.peso - b.peso)
    .slice(0, MAXIMO_JUEGOS)
    .map(({ punto }) => [punto]);
}

// El punto del camino a esa cantidad de metros desde el origen
function puntoA(camino: Punto[], metros: number): Punto {
  let recorrido = 0;
  for (let i = 1; i < camino.length; i++) {
    const tramo = distanciaEntre(camino[i - 1], camino[i]);
    if (recorrido + tramo >= metros) {
      const t = tramo === 0 ? 0 : (metros - recorrido) / tramo;
      return {
        latitud: camino[i - 1].latitud + (camino[i].latitud - camino[i - 1].latitud) * t,
        longitud: camino[i - 1].longitud + (camino[i].longitud - camino[i - 1].longitud) * t,
      };
    }
    recorrido += tramo;
  }
  return camino[camino.length - 1];
}
