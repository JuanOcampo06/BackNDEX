import { Logger } from '@nestjs/common';
import { Punto, RutasPorCallesPort } from '../application/rutas-por-calles.port';

const URL_GOOGLE = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const ESPERA_MAXIMA_MS = 12_000;

// Google cobra segun los campos que se piden, asi que solo se pide el trazado
const CAMPOS = 'routes.polyline.encodedPolyline';

// Modo a pie porque Google no tiene rutas en bicicleta para Bogota (responde 200 pero sin ninguna ruta, comprobado en noviembre de 2026)
// el trazado a pie va por calles y andenes y es el que mas se parece a una ruta de bicicleta
// si algun dia Google las ofrece, se cambia aqui por BICYCLE
const MODO = 'WALK';

const PRECISION_POLILINEA = 1e5;

interface RespuestaGoogle {
  routes?: { polyline?: { encodedPolyline?: string } }[];
}

// Traza caminos por calles reales con Routes API de Google
// sin llave en GOOGLE_MAPS_API_KEY no hace nada y nunca lanza errores: devuelve una lista vacia y las rutas quedan como las calcula la red de ciclovias
export class GoogleRutasPorCallesAdapter implements RutasPorCallesPort {
  private readonly logger = new Logger(GoogleRutasPorCallesAdapter.name);

  constructor(private readonly llave: string) {}

  // Con computeAlternativeRoutes Google manda hasta tres caminos distintos en una sola llamada
  alternativasPorCalles(origen: Punto, destino: Punto): Promise<Punto[][]> {
    return this.pedir({ origin: lugar(origen), destination: lugar(destino), computeAlternativeRoutes: true });
  }

  // Google no permite pedir alternativas cuando hay puntos intermedios, asi que aqui se pide un solo camino
  async rutaPorPuntos(origen: Punto, destino: Punto, intermedios: Punto[]): Promise<Punto[] | null> {
    const caminos = await this.pedir({ origin: lugar(origen), destination: lugar(destino), intermediates: intermedios.map(lugar) });
    return caminos[0] ?? null;
  }

  private async pedir(cuerpo: Record<string, unknown>): Promise<Punto[][]> {
    if (this.llave === '') {
      return [];
    }
    try {
      const respuesta = await fetch(URL_GOOGLE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.llave, 'X-Goog-FieldMask': CAMPOS },
        body: JSON.stringify({ ...cuerpo, travelMode: MODO, languageCode: 'es', units: 'METRIC' }),
        signal: AbortSignal.timeout(ESPERA_MAXIMA_MS),
      });
      if (!respuesta.ok) {
        // El detalle sirve para ver, por ejemplo, que Routes API esta apagada en la llave
        this.logger.warn(`Google respondio ${respuesta.status}: ${await respuesta.text()}`);
        return [];
      }
      return trazadosDe((await respuesta.json()) as RespuestaGoogle);
    } catch (error) {
      this.logger.warn(`No se pudo hablar con Google: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
}

function lugar(punto: Punto): { location: { latLng: { latitude: number; longitude: number } } } {
  return { location: { latLng: { latitude: punto.latitud, longitude: punto.longitud } } };
}

// Los puntos de cada camino de la respuesta y se descartan los que vengan vacios
export function trazadosDe(respuesta: RespuestaGoogle): Punto[][] {
  return (respuesta.routes ?? [])
    .map((camino) => decodificarPolilinea(camino.polyline?.encodedPolyline ?? ''))
    .filter((puntos) => puntos.length >= 2);
}

// Lee una linea en el formato "encoded polyline" de Google
export function decodificarPolilinea(codificada: string): Punto[] {
  const puntos: Punto[] = [];
  let indice = 0;
  let latitud = 0;
  let longitud = 0;

  const siguiente = (): number => {
    let resultado = 0;
    let desplazamiento = 0;
    let byte: number;
    do {
      byte = codificada.charCodeAt(indice++) - 63;
      resultado |= (byte & 0x1f) << desplazamiento;
      desplazamiento += 5;
    } while (byte >= 0x20);
    return resultado & 1 ? ~(resultado >> 1) : resultado >> 1;
  };

  while (indice < codificada.length) {
    latitud += siguiente();
    longitud += siguiente();
    puntos.push({ latitud: latitud / PRECISION_POLILINEA, longitud: longitud / PRECISION_POLILINEA });
  }
  return puntos;
}
