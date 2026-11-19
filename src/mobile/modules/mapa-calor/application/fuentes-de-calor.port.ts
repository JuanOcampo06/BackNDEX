import { ReporteCiudadano, SiniestroDelAnuario } from '../domain/mapa-calor';

export const FUENTES_DE_CALOR = Symbol('FUENTES_DE_CALOR');

// Puerto para leer lo que alimenta el mapa de calor sin saber de que base de datos viene
export interface FuentesDeCalorPort {
  // Siniestros del anuario
  siniestros(): Promise<SiniestroDelAnuario[]>;
  // Reportes de ciudadanos creados desde esa fecha que la entidad no descarto
  reportesDesde(desde: Date): Promise<ReporteCiudadano[]>;
}
