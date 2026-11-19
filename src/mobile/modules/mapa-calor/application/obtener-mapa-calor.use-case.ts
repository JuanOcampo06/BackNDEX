import { armarMapaDeCalor, PuntoDeCalor } from '../domain/mapa-calor';
import { FuentesDeCalorPort } from './fuentes-de-calor.port';

// Solo cuentan los reportes de los ultimos 90 dias: un hueco o un robo viejo ya no dice mucho del presente
export const DIAS_DE_REPORTES = 90;
const MS_POR_DIA = 86_400_000;

export interface MapaDeCalor {
  total: number;
  puntos: PuntoDeCalor[];
}

// Manchas del mapa de calor de toda la ciudad con los siniestros del anuario y los reportes recientes
export class ObtenerMapaCalorUseCase {
  constructor(
    private readonly fuentes: FuentesDeCalorPort,
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<MapaDeCalor> {
    const desde = new Date(this.ahora().getTime() - DIAS_DE_REPORTES * MS_POR_DIA);
    const [siniestros, reportes] = await Promise.all([this.fuentes.siniestros(), this.fuentes.reportesDesde(desde)]);
    const puntos = armarMapaDeCalor(siniestros, reportes);
    return { total: puntos.length, puntos };
  }
}
