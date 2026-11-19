import { Punto } from '../../../../shared/distancia';
import { Acceso, caminoMinimo } from '../domain/camino-minimo';
import { CRITERIOS_RUTA } from '../domain/catalogos';
import { CriterioRuta } from '../domain/catalogos';
import { costoDe } from '../domain/costos';
import { anclajesDe, anclajesSegurosDe } from '../domain/anclajes';
import { IndiceSiniestros, SiniestroUbicado } from '../domain/indice-siniestros';
import { IndiceTramos } from '../domain/indice-tramos';
import { elegirMejor, largoMedido, medirRuta, RutaMedida } from '../domain/medicion';
import { ALCANCE_MAXIMO_M, construirRed, NodoDeAcceso, nodosDeAcceso, RedVial } from '../domain/red-vial';
import { mismoCamino } from '../domain/parecido';
import { armarRuta, armarRutaMedida, Ruta } from '../domain/ruta';
import { validarTrayecto } from '../domain/trayecto';
import { RutaFueraDeCoberturaError } from '../domain/ruta-fuera-de-cobertura.error';
import { RutaSinCaminoError } from '../domain/ruta-sin-camino.error';
import { ViaCiclista } from '../domain/via-ciclista';
import { RedCicloviasRepositoryPort } from './red-ciclovias.repository.port';
import { RutasPorCallesPort } from './rutas-por-calles.port';
import { SiniestrosRepositoryPort } from './siniestros.repository.port';

export interface PeticionRutas {
  origen: Punto;
  destino: Punto;
}

// Las rutas calculadas y si ya hay datos de riesgo para que la segura los tenga en cuenta
export interface ResultadoRutas {
  rutas: Ruta[];
  riesgoDisponible: boolean;
}

// Cuanto mas largo que la ruta mas corta puede ser un camino que se desvia hacia una ciclovia para que valga la pena considerarlo
const DESVIO_MAXIMO = 0.3;

// Lo que se arma una vez por cada lista de ciclovias y de siniestros
interface Preparacion {
  red: RedVial;
  indice: IndiceTramos;
  siniestros: IndiceSiniestros;
}

// El ciudadano elige a donde ir: se calcula la ruta segura, la equilibrada y la rapida
// el servicio de mapas ofrece varios caminos reales por las calles y de cada uno se mide cuanto va pegado a una ciclovia
// y cuantos siniestros del anuario hubo junto a cada trozo, vaya por ciclovia o por calle
// cada criterio se queda con el camino que menos cuesta: la rapida el que menos tarda, la segura el que va mas por ciclovia y pasa junto a menos siniestros
// los siniestros nunca se le muestran al ciudadano: solo deciden las rutas
// sin servicio de mapas (o si no responde) las rutas salen solo de la red de ciclovias
export class CalcularRutasUseCase {
  // Lo que se arma con las ciclovias y los siniestros solo se vuelve a armar cuando los repositorios entregan datos nuevos
  private viasUsadas: ViaCiclista[] | null = null;
  private siniestrosUsados: SiniestroUbicado[] | null = null;
  private preparacion: Preparacion | null = null;

  constructor(
    private readonly ciclovias: RedCicloviasRepositoryPort,
    private readonly calles: RutasPorCallesPort,
    private readonly siniestros: SiniestrosRepositoryPort,
  ) {}

  async execute(peticion: PeticionRutas): Promise<ResultadoRutas> {
    const { origen, destino } = validarTrayecto(peticion.origen, peticion.destino);
    const preparacion = await this.preparar();
    const { red } = preparacion;
    const alternativas = await this.calles.alternativasPorCalles(origen, destino);
    if (alternativas.length === 0) {
      return { rutas: calcularPorCiclovias(red, origen, destino), riesgoDisponible: red.hayRiesgo };
    }
    const candidatas = await this.candidatas(alternativas, origen, destino, preparacion);
    const rutas = CRITERIOS_RUTA.map((criterio) => armarRutaMedida(criterio, elegirMejor(criterio, candidatas)));
    return { rutas, riesgoDisponible: red.hayRiesgo };
  }

  // A las alternativas de las calles se suman caminos que pasan por una buena ciclovia cercana y por calles paralelas con menos siniestros
  // asi casi siempre hay opciones distintas para la segura, la equilibrada y la rapida
  // solo se consideran los que no alargan el viaje mas del 30% y los que son en la practica el mismo camino se cuentan una sola vez
  private async candidatas(alternativas: Punto[][], origen: Punto, destino: Punto, { indice, siniestros }: Preparacion): Promise<RutaMedida[]> {
    const anclajes = [...anclajesDe(alternativas[0], indice), ...anclajesSegurosDe(alternativas[0], siniestros)];
    const desvios = await Promise.all(anclajes.map((puntos) => this.calles.rutaPorPuntos(origen, destino, puntos)));
    const caminos = [...alternativas, ...desvios.filter((trazado): trazado is Punto[] => trazado !== null)];
    const medidas = sinRepetidos(caminos).map((trazado) => medirRuta(trazado, indice, siniestros));
    const limite = Math.min(...medidas.map(largoMedido)) * (1 + DESVIO_MAXIMO);
    return medidas.filter((ruta) => largoMedido(ruta) <= limite);
  }

  private async preparar(): Promise<Preparacion> {
    const [vias, siniestros] = await Promise.all([this.ciclovias.obtenerVias(), this.siniestros.obtenerSiniestros()]);
    if (this.preparacion === null || vias !== this.viasUsadas || siniestros !== this.siniestrosUsados) {
      this.preparacion = { red: construirRed(vias), indice: new IndiceTramos(vias), siniestros: new IndiceSiniestros(siniestros) };
      this.viasUsadas = vias;
      this.siniestrosUsados = siniestros;
    }
    return this.preparacion;
  }
}

// Quita los caminos que son en la practica el mismo que uno anterior y deja el primero, que es el que Google considera mejor
function sinRepetidos(caminos: Punto[][]): Punto[][] {
  const distintos: Punto[][] = [];
  for (const camino of caminos) {
    if (!distintos.some((otro) => mismoCamino(camino, otro))) {
      distintos.push(camino);
    }
  }
  return distintos;
}

function calcularPorCiclovias(red: RedVial, origen: Punto, destino: Punto): Ruta[] {
  const entradas = buscarAccesos(red, origen, 'origen');
  const salidas = buscarAccesos(red, destino, 'destino');
  return CRITERIOS_RUTA.map((criterio) => {
    const camino = caminoMinimo(red, aCostos(criterio, entradas), aCostos(criterio, salidas), (arista) => costoDe(criterio, arista));
    if (camino === null) {
      throw new RutaSinCaminoError();
    }
    return armarRuta(criterio, origen, destino, red, camino);
  });
}

function buscarAccesos(red: RedVial, punto: Punto, lugar: 'origen' | 'destino'): NodoDeAcceso[] {
  const accesos = nodosDeAcceso(red, punto);
  if (accesos.length === 0) {
    throw new RutaFueraDeCoberturaError(lugar, ALCANCE_MAXIMO_M);
  }
  return accesos;
}

// Llegar a un nodo de acceso desde el punto cuesta lo mismo que recorrer ese trayecto por calle normal con el criterio de la ruta
function aCostos(criterio: CriterioRuta, accesos: NodoDeAcceso[]): Acceso[] {
  return accesos.map(({ nodo, distanciaM }) => ({
    nodo: nodo.id,
    costo: costoDe(criterio, { distanciaM, tipo: 'conexion', riesgo: null }),
  }));
}
