import { Injectable } from '@nestjs/common';
import { Workbook, Worksheet } from 'exceljs';
import {
  CeldaExcel,
  GeneradorExcelPort,
  HojaExcel,
  LibroExcel,
} from '../application/generador-excel.port';

const ANCHO_MINIMO = 10;
const ANCHO_MAXIMO = 60;
const MARGEN_DE_ANCHO = 2;
const COLOR_ENCABEZADO = 'FFD9E2F3';

// Genera el archivo xlsx con la libreria exceljs
@Injectable()
export class ExcelJsGeneradorExcel implements GeneradorExcelPort {
  async generar(libro: LibroExcel): Promise<Uint8Array> {
    const excel = new Workbook();
    excel.creator = 'Safe Path Twin';
    for (const hoja of libro.hojas) {
      agregarHoja(excel, hoja);
    }
    return new Uint8Array(await excel.xlsx.writeBuffer());
  }
}

function agregarHoja(excel: Workbook, hoja: HojaExcel): void {
  const hojaExcel = excel.addWorksheet(hoja.nombre);
  const anchos: number[] = [];
  hoja.secciones.forEach((seccion, posicion) => {
    if (posicion > 0) {
      hojaExcel.addRow([]);
    }
    if (seccion.titulo !== undefined) {
      hojaExcel.addRow([seccion.titulo]).font = { bold: true, size: 13 };
    }
    ponerEncabezado(hojaExcel, seccion.columnas);
    seccion.filas.forEach((fila) => hojaExcel.addRow(fila));
    // El titulo no cuenta para el ancho porque es largo y solo ocupa la primera celda
    [seccion.columnas, ...seccion.filas].forEach((fila) => medirAnchos(anchos, fila));
  });
  anchos.forEach((ancho, columna) => {
    hojaExcel.getColumn(columna + 1).width = Math.min(Math.max(ancho + MARGEN_DE_ANCHO, ANCHO_MINIMO), ANCHO_MAXIMO);
  });
}

function ponerEncabezado(hoja: Worksheet, columnas: string[]): void {
  hoja.addRow(columnas).eachCell((celda) => {
    celda.font = { bold: true };
    celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLOR_ENCABEZADO } };
  });
}

function medirAnchos(anchos: number[], fila: CeldaExcel[]): void {
  fila.forEach((celda, columna) => {
    anchos[columna] = Math.max(anchos[columna] ?? 0, String(celda ?? '').length);
  });
}
