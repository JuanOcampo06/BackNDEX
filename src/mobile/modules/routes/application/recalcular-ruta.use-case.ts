import { Punto } from '../../../../shared/distancia';
import { CriterioRuta } from '../domain/catalogos';
import { Ruta } from '../domain/ruta';
import { PeticionRutas, ResultadoRutas } from './calcular-rutas.use-case';

export interface PeticionRecalculo {
  // Donde esta el ciudadano ahora, que ya no es el origen
  actual: Punto;
  destino: Punto;
  // El tipo de ruta que el ciudadano habia elegido y que se mantiene al recalcular
  tipo: CriterioRuta;
}

export interface RutaRecalculada {
  ruta: Ruta;
  riesgoDisponible: boolean;
}

// Lo unico que se necesita del calculo de rutas
interface CalculaRutas {
  execute(peticion: PeticionRutas): Promise<ResultadoRutas>;
}

// El ciudadano se salio de la ruta: se calcula de nuevo desde donde esta hasta el mismo destino
// con el mismo criterio que habia elegido (segura, equilibrada o rapida) y se devuelve solo esa ruta para que la app la cambie sin preguntar
export class RecalcularRutaUseCase {
  constructor(private readonly calcularRutas: CalculaRutas) {}

  async execute(peticion: PeticionRecalculo): Promise<RutaRecalculada> {
    const { rutas, riesgoDisponible } = await this.calcularRutas.execute({ origen: peticion.actual, destino: peticion.destino });
    const ruta = rutas.find((candidata) => candidata.tipo === peticion.tipo) ?? rutas[0];
    return { ruta, riesgoDisponible };
  }
}
