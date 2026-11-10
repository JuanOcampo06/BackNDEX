import { distanciaEntre, Punto } from '../../../../shared/distancia';
import { CaminoMinimo } from './camino-minimo';
import { CriterioRuta, TipoTramo } from './catalogos';
import { duracionDe } from './costos';
import { calcularPasos, PasoRuta } from './maniobras';
import { Nodo, RedVial } from './red-vial';

// Una ruta lista para dibujar en el mapa y para guiar al ciudadano
// coordenadas son pares de latitud y longitud desde el origen hasta el destino
export interface Ruta {
  tipo: CriterioRuta;
  distanciaM: number;
  duracionS: number;
  // Que parte de la ruta va por ciclovia y el resto va por calle normal
  porcentajeEnCiclovia: number;
  coordenadas: [number, number][];
  pasos: PasoRuta[];
}

interface Tramo {
  distanciaM: number;
  tipo: TipoTramo;
}

// Arma la ruta con el camino encontrado
// el trayecto desde el origen hasta la ciclovia y desde la ciclovia hasta el destino cuenta como calle normal
export function armarRuta(criterio: CriterioRuta, origen: Punto, destino: Punto, red: RedVial, camino: CaminoMinimo): Ruta {
  const nodos = camino.nodos.map((id) => red.nodos.get(id) as Nodo);
  const tramos: Tramo[] = [
    { distanciaM: distanciaEntre(origen, nodos[0]), tipo: 'conexion' },
    ...camino.aristas.map((arista) => ({ distanciaM: arista.distanciaM, tipo: arista.tipo })),
    { distanciaM: distanciaEntre(nodos[nodos.length - 1], destino), tipo: 'conexion' },
  ];
  const coordenadas = sinRepetidos([origen, ...nodos, destino]);
  const distanciaM = suma(tramos.map((tramo) => tramo.distanciaM));
  const enCiclovia = suma(tramos.filter((tramo) => tramo.tipo !== 'conexion').map((tramo) => tramo.distanciaM));
  return {
    tipo: criterio,
    distanciaM: redondear(distanciaM, 1),
    duracionS: Math.round(suma(tramos.map((tramo) => duracionDe(tramo.tipo, tramo.distanciaM)))),
    porcentajeEnCiclovia: distanciaM === 0 ? 0 : redondear((enCiclovia / distanciaM) * 100, 1),
    coordenadas: coordenadas.map((punto) => [punto.latitud, punto.longitud]),
    pasos: calcularPasos(coordenadas),
  };
}

// Quita los puntos que repiten al anterior, por ejemplo cuando el origen cae justo sobre un nodo
function sinRepetidos(puntos: Punto[]): Punto[] {
  return puntos.filter((punto, i) => i === 0 || punto.latitud !== puntos[i - 1].latitud || punto.longitud !== puntos[i - 1].longitud);
}

function suma(valores: number[]): number {
  return valores.reduce((total, valor) => total + valor, 0);
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
