export const GENERADOR_EXCEL = Symbol('GENERADOR_EXCEL');

// Valor de una celda y null deja la celda vacia
export type CeldaExcel = string | number | null;

// Tabla dentro de una hoja con titulo opcional, encabezados y filas
export interface SeccionExcel {
  titulo?: string;
  columnas: string[];
  filas: CeldaExcel[][];
}

// Una hoja del libro y las secciones se apilan de arriba hacia abajo
export interface HojaExcel {
  nombre: string;
  secciones: SeccionExcel[];
}

export interface LibroExcel {
  hojas: HojaExcel[];
}

// Puerto que convierte un libro neutro en los bytes de un archivo xlsx sin saber con que libreria se arma
export interface GeneradorExcelPort {
  generar(libro: LibroExcel): Promise<Uint8Array>;
}
