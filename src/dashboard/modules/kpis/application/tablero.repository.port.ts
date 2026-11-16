import { Fuente, Indicador } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';

export const TABLERO_REPOSITORY = Symbol('TABLERO_REPOSITORY');

// Formas de los datos que devuelve la base de datos para cada grafica

export interface Localidad {
  id: number;
  nombre: string;
}

// Primer y ultimo mes AAAA-MM con datos y null cuando no hay ninguno
export interface RangoDeMeses {
  primerMes: string | null;
  ultimoMes: string | null;
}

// Ultimo dia AAAA-MM-DD con datos de cada fuente externa
export interface FechasDeCorte {
  anuario: string | null;
  ciclovias: string | null;
}

export interface ConteoSemanal {
  semana: string;
  total: number;
}

export interface ConteoMensual {
  mes: string;
  total: number;
}

export interface SiniestroEnMapa {
  id: number;
  latitud: number;
  longitud: number;
  gravedad: string;
  clase: string;
  tipoVehiculo: string;
  ocurridoEn: string;
}

// Siniestro con los datos que necesita la hoja de Excel ademas de los del mapa
export interface SiniestroDetallado extends SiniestroEnMapa {
  localidad: string;
}

export interface ConteoLugarHora {
  lugar: string;
  localidad: string;
  hora: number;
  total: number;
}

export interface ConteoSexoEdad {
  sexo: string;
  edad: number;
  total: number;
}

export interface ConteoPorTipo {
  tipoVehiculo: string;
  total: number;
}

export interface ConteoPorLugar {
  lugar: string;
  localidad: string;
  latitud: number;
  longitud: number;
  total: number;
}

export interface ReporteEnMapa {
  id: number;
  latitud: number;
  longitud: number;
  categoria: string;
}

// Reporte con los datos que necesita la hoja de Excel ademas de los del mapa
export interface ReporteDetallado extends ReporteEnMapa {
  localidad: string;
  tipoVehiculo: string;
  mes: string;
}

export interface ConteoPorMotivo {
  motivo: string;
  total: number;
}

// Puerto que el tablero necesita para leer sus datos sin saber de que base de datos vienen
export interface TableroRepositoryPort {
  listarLocalidades(): Promise<Localidad[]>;
  buscarRangoDeMeses(fuentes: readonly Fuente[]): Promise<RangoDeMeses>;
  buscarFechasDeCorte(): Promise<FechasDeCorte>;
  contarPorSemana(indicador: Indicador, filtros: FiltrosTablero): Promise<ConteoSemanal[]>;
  listarSiniestros(filtros: FiltrosTablero): Promise<SiniestroDetallado[]>;
  contarSiniestrosPorLugarYHora(filtros: FiltrosTablero): Promise<ConteoLugarHora[]>;
  contarSiniestrosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]>;
  contarVictimasPorSexoYEdad(filtros: FiltrosTablero): Promise<ConteoSexoEdad[]>;
  contarUsuariosPorTipo(filtros: FiltrosTablero): Promise<ConteoPorTipo[]>;
  contarActivacionesPorLugar(filtros: FiltrosTablero): Promise<ConteoPorLugar[]>;
  listarReportes(filtros: FiltrosTablero): Promise<ReporteDetallado[]>;
  contarFalsosPositivosPorMotivo(filtros: FiltrosTablero): Promise<ConteoPorMotivo[]>;
  contarFalsosPositivosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]>;
}
