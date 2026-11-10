import { Riesgo, RIESGOS } from './catalogos';

// Via de ciclovia tal como la entrega la fuente de datos
// nodos y coordenadas van en el mismo orden y un mismo nodo en dos vias significa que se conectan
export interface ViaCiclista {
  id: number;
  tipo: 'ciclovia' | 'cruce';
  riesgo: string | null;
  nodos: number[];
  coordenadas: [number, number][];
}

// Un riesgo que no sea bajo, medio o alto se trata como si no hubiera dato
export function normalizarRiesgo(riesgo: string | null): Riesgo | null {
  return (RIESGOS as readonly string[]).includes(riesgo ?? '') ? (riesgo as Riesgo) : null;
}
