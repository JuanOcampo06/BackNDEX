// Un punto del planeta con su latitud y longitud en grados
export interface Punto {
  latitud: number;
  longitud: number;
}

const RADIO_TIERRA_M = 6_371_000;

function aRadianes(grados: number): number {
  return (grados * Math.PI) / 180;
}

// Metros en linea recta entre dos puntos del planeta con la formula de haversine
// lo usan los modulos moviles que miden recorridos como viajes y rutas
export function distanciaEntre(a: Punto, b: Punto): number {
  const dLat = aRadianes(b.latitud - a.latitud);
  const dLon = aRadianes(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aRadianes(a.latitud)) * Math.cos(aRadianes(b.latitud)) * Math.sin(dLon / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.sqrt(h));
}
