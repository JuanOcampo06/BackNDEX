// Tamano de cada cuadro del mapa de calor en grados (unos 440 metros en Bogota)
export const CUADRO_GRADOS = 0.004;

// Radio de cada mancha en metros: un poco mas que medio cuadro para que las vecinas se junten
export const RADIO_MANCHA_M = 450;

// Un cuadro con menos peso que este no se dibuja para que el mapa no se llene de manchas sueltas
export const PESO_MINIMO_CUADRO = 3;

// El cuadro en este percentil y los que tengan mas peso se ven con el color mas fuerte
// asi unos pocos puntos muy cargados no dejan palido el resto de la ciudad
const PERCENTIL_MAXIMO = 0.95;

// Un siniestro con bicicleta pesa el doble y uno con muertos el triple, igual que en las rutas
const PESO_CON_BICICLETA = 2;
const PESO_CON_MUERTOS = 3;

// Peso de cada tipo de reporte ciudadano: los que no son un peligro (por ejemplo policia) no cuentan
export const PESO_POR_SUBCATEGORIA: Readonly<Record<string, number>> = {
  accidente: 3,
  robo: 2,
  hueco: 1,
  obra: 1,
  via_cerrada: 1,
  semaforo_danado: 1,
  poca_luz: 1,
};

// Siniestro del anuario con lo que se necesita para pesarlo
export interface SiniestroDelAnuario {
  latitud: number;
  longitud: number;
  conBicicleta: boolean;
  conMuertos: boolean;
}

// Reporte reciente de un ciudadano con su ubicacion
export interface ReporteCiudadano {
  latitud: number;
  longitud: number;
  subcategoria: string;
}

// Una mancha del mapa de calor tal como la dibuja la app
export interface PuntoDeCalor {
  latitud: number;
  longitud: number;
  // De 0 (poco) a 1 (mucho)
  peso: number;
  radioM: number;
}

interface PuntoPesado {
  latitud: number;
  longitud: number;
  peso: number;
}

export function pesoDeSiniestro(siniestro: SiniestroDelAnuario): number {
  return (siniestro.conBicicleta ? PESO_CON_BICICLETA : 1) * (siniestro.conMuertos ? PESO_CON_MUERTOS : 1);
}

export function pesoDeReporte(reporte: ReporteCiudadano): number {
  return PESO_POR_SUBCATEGORIA[reporte.subcategoria] ?? 0;
}

// Junta siniestros y reportes en cuadros, pone cada mancha en el centro de lo que paso dentro del cuadro
// y la escala de 0 a 1; el mapa no muestra siniestros sueltos sino donde se concentran
export function armarMapaDeCalor(siniestros: SiniestroDelAnuario[], reportes: ReporteCiudadano[]): PuntoDeCalor[] {
  const puntos: PuntoPesado[] = [
    ...siniestros.map((s) => ({ latitud: s.latitud, longitud: s.longitud, peso: pesoDeSiniestro(s) })),
    ...reportes.map((r) => ({ latitud: r.latitud, longitud: r.longitud, peso: pesoDeReporte(r) })),
  ];

  const cuadros = new Map<string, { peso: number; sumaLat: number; sumaLon: number }>();
  for (const punto of puntos) {
    if (punto.peso <= 0) {
      continue;
    }
    const clave = `${Math.floor(punto.latitud / CUADRO_GRADOS)}|${Math.floor(punto.longitud / CUADRO_GRADOS)}`;
    const cuadro = cuadros.get(clave) ?? { peso: 0, sumaLat: 0, sumaLon: 0 };
    cuadro.peso += punto.peso;
    cuadro.sumaLat += punto.latitud * punto.peso;
    cuadro.sumaLon += punto.longitud * punto.peso;
    cuadros.set(clave, cuadro);
  }

  const visibles = [...cuadros.values()].filter((c) => c.peso >= PESO_MINIMO_CUADRO);
  if (visibles.length === 0) {
    return [];
  }
  const tope = percentil(visibles.map((c) => c.peso), PERCENTIL_MAXIMO);

  return visibles
    .map((c) => ({
      latitud: redondear(c.sumaLat / c.peso, 5),
      longitud: redondear(c.sumaLon / c.peso, 5),
      peso: redondear(Math.min(1, c.peso / tope), 2),
      radioM: RADIO_MANCHA_M,
    }))
    .sort((a, b) => b.peso - a.peso);
}

function percentil(valores: number[], p: number): number {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.floor(p * ordenados.length))];
}

function redondear(valor: number, decimales: number): number {
  const factor = 10 ** decimales;
  return Math.round(valor * factor) / factor;
}
