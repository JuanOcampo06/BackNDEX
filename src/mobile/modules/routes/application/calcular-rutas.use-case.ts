import { Punto } from '../../../../shared/distancia';
import { Acceso, caminoMinimo } from '../domain/camino-minimo';
import { CRITERIOS_RUTA } from '../domain/catalogos';
import { CriterioRuta } from '../domain/catalogos';
import { costoDe } from '../domain/costos';
import { ALCANCE_MAXIMO_M, construirRed, NodoDeAcceso, nodosDeAcceso, RedVial } from '../domain/red-vial';
import { armarRuta, Ruta } from '../domain/ruta';
import { validarTrayecto } from '../domain/trayecto';
import { RutaFueraDeCoberturaError } from '../domain/ruta-fuera-de-cobertura.error';
import { RutaSinCaminoError } from '../domain/ruta-sin-camino.error';
import { ViaCiclista } from '../domain/via-ciclista';
import { RedCicloviasRepositoryPort } from './red-ciclovias.repository.port';

export interface PeticionRutas {
  origen: Punto;
  destino: Punto;
}

// Las rutas calculadas y si ya hay datos de riesgo para que la segura los tenga en cuenta
export interface ResultadoRutas {
  rutas: Ruta[];
  riesgoDisponible: boolean;
}

// El ciudadano elige a donde ir: se calcula la ruta rapida y la segura por la red de ciclovias
export class CalcularRutasUseCase {
  // La red solo se vuelve a armar cuando el repositorio entrega datos nuevos
  private viasUsadas: ViaCiclista[] | null = null;
  private red: RedVial | null = null;

  constructor(private readonly ciclovias: RedCicloviasRepositoryPort) {}

  async execute(peticion: PeticionRutas): Promise<ResultadoRutas> {
    const { origen, destino } = validarTrayecto(peticion.origen, peticion.destino);
    const red = await this.obtenerRed();
    const entradas = buscarAccesos(red, origen, 'origen');
    const salidas = buscarAccesos(red, destino, 'destino');
    const rutas = CRITERIOS_RUTA.map((criterio) => {
      const camino = caminoMinimo(red, aCostos(criterio, entradas), aCostos(criterio, salidas), (arista) => costoDe(criterio, arista));
      if (camino === null) {
        throw new RutaSinCaminoError();
      }
      return armarRuta(criterio, origen, destino, red, camino);
    });
    return { rutas, riesgoDisponible: red.hayRiesgo };
  }

  private async obtenerRed(): Promise<RedVial> {
    const vias = await this.ciclovias.obtenerVias();
    if (this.red === null || vias !== this.viasUsadas) {
      this.red = construirRed(vias);
      this.viasUsadas = vias;
    }
    return this.red;
  }
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
