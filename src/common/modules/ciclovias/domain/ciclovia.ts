// Una ciclovia es cruce cuando atraviesa una calle y ciclovia en cualquier otro tramo
export const TIPOS_CICLOVIA = ['ciclovia', 'cruce'] as const;
export type TipoCiclovia = (typeof TIPOS_CICLOVIA)[number];

// Tramo de ciclovia tal como lo leen el dashboard y la app movil
// riesgo es null mientras no se calcule y coordenadas son pares de latitud y longitud
export interface Ciclovia {
  id: number;
  tipo: TipoCiclovia;
  nombre: string | null;
  riesgo: string | null;
  nodos: number[];
  coordenadas: [number, number][];
}
