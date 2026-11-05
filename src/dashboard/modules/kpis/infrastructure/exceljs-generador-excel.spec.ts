import { Workbook } from 'exceljs';
import { LibroExcel } from '../application/generador-excel.port';
import { ExcelJsGeneradorExcel } from './exceljs-generador-excel';

// Se genera el archivo de verdad y se vuelve a abrir con la libreria para comprobar lo que quedo escrito
describe('ExcelJsGeneradorExcel', () => {
  const libro: LibroExcel = {
    hojas: [
      {
        nombre: 'Resumen',
        secciones: [
          { titulo: 'Totales', columnas: ['Dato', 'Valor'], filas: [['Siniestros', 120], ['Sin dato', null]] },
          { titulo: 'Por mes', columnas: ['Mes', 'Total'], filas: [['2026-08', 40]] },
        ],
      },
      { nombre: 'Otra hoja', secciones: [{ columnas: ['A'], filas: [['x']] }] },
    ],
  };

  async function abrir(): Promise<Workbook> {
    const bytes = await new ExcelJsGeneradorExcel().generar(libro);
    return new Workbook().xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
  }

  it('devuelve un archivo xlsx valido que es un zip', async () => {
    const bytes = await new ExcelJsGeneradorExcel().generar(libro);

    expect(Buffer.from(bytes.subarray(0, 2)).toString()).toBe('PK');
  });

  it('crea una hoja por cada hoja del libro con su nombre', async () => {
    const excel = await abrir();

    expect(excel.worksheets.map((hoja) => hoja.name)).toEqual(['Resumen', 'Otra hoja']);
  });

  it('apila las secciones con titulo encabezado en negrita filas y una fila vacia entre secciones', async () => {
    const hoja = (await abrir()).getWorksheet('Resumen');

    // La fila vacia no tiene celdas y exceljs la entrega como undefined
    const valores = hoja?.getSheetValues().slice(1).map((fila) => (fila as unknown[] | undefined)?.slice(1));
    expect(valores).toEqual([
      ['Totales'],
      ['Dato', 'Valor'],
      ['Siniestros', 120],
      ['Sin dato'],
      undefined,
      ['Por mes'],
      ['Mes', 'Total'],
      ['2026-08', 40],
    ]);
    expect(hoja?.getRow(2).getCell(1).font?.bold).toBe(true);
    expect(hoja?.getRow(3).getCell(2).value).toBe(120);
  });
});
