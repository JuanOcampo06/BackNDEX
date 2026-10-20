import { Indicador } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';

export const TABLERO_REPOSITORY = Symbol('TABLERO_REPOSITORY');

// Formas de los datos que devuelve la base de datos para cada grafica

export interface Localidad {
  id: number;
  nombre: string;
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

export interface Cicloruta {
  id: number;
  nombre: string;
  riesgo: string;
  trazado: [number, number][];
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

export interface ConteoPorMotivo {
  motivo: string;
  total: number;
}

// Puerto que el tablero necesita para leer sus datos sin saber de que base de datos vienen
export interface TableroRepositoryPort {
  listarLocalidades(): Promise<Localidad[]>;
  contarPorSemana(indicador: Indicador, filtros: FiltrosTablero): Promise<ConteoSemanal[]>;
  listarSiniestros(filtros: FiltrosTablero): Promise<SiniestroEnMapa[]>;
  listarCiclorutas(): Promise<Cicloruta[]>;
  contarSiniestrosPorLugarYHora(filtros: FiltrosTablero): Promise<ConteoLugarHora[]>;
  contarSiniestrosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]>;
  contarVictimasPorSexoYEdad(filtros: FiltrosTablero): Promise<ConteoSexoEdad[]>;
  contarUsuariosPorTipo(filtros: FiltrosTablero): Promise<ConteoPorTipo[]>;
  contarActivacionesPorLugar(filtros: FiltrosTablero): Promise<ConteoPorLugar[]>;
  listarReportes(filtros: FiltrosTablero): Promise<ReporteEnMapa[]>;
  contarFalsosPositivosPorMotivo(filtros: FiltrosTablero): Promise<ConteoPorMotivo[]>;
  contarFalsosPositivosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]>;
}
