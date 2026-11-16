import { Fuente } from './catalogos';

// Nombre con el que se muestra cada fuente en el Excel y en los creditos igual que en el tablero
export const NOMBRE_DE_FUENTE: Record<Fuente, string> = {
  anuario: 'Secretaría Distrital de Movilidad',
  app: 'App',
};

// Datos fijos del credito de cada fuente externa que usa el tablero
// el enlace y la licencia son los que publica cada entidad y la fecha de corte sale de los datos cargados
export interface CreditoDeFuente {
  fuente: 'anuario' | 'ciclovias';
  nombre: string;
  entidad: string;
  enlace: string;
  licencia: string;
  enlaceLicencia: string;
}

export const CREDITO_ANUARIO: CreditoDeFuente = {
  fuente: 'anuario',
  nombre: 'Anuario de Siniestralidad Vial de Bogotá',
  entidad: NOMBRE_DE_FUENTE.anuario,
  enlace: 'https://datosabiertos.bogota.gov.co/dataset/anuario-siniestralidad',
  licencia: 'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)',
  enlaceLicencia: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
};

export const CREDITO_CICLOVIAS: CreditoDeFuente = {
  fuente: 'ciclovias',
  nombre: 'Ciclovías de OpenStreetMap',
  entidad: 'Colaboradores de OpenStreetMap',
  enlace: 'https://www.openstreetmap.org/copyright',
  licencia: 'Open Database License (ODbL) 1.0',
  enlaceLicencia: 'https://opendatacommons.org/licenses/odbl/1-0/',
};
