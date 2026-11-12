import { Periodo } from '../domain/periodo';
import { ExportarKpisUseCase } from './exportar-kpis.use-case';
import { GeneradorExcelPort, LibroExcel } from './generador-excel.port';
import { CasosDeUsoKpi } from './hojas-excel-kpis';
import { ObtenerBotonPanicoUseCase } from './obtener-boton-panico.use-case';
import { ObtenerFalsosPositivosUseCase } from './obtener-falsos-positivos.use-case';
import { ObtenerFiltrosUseCase } from './obtener-filtros.use-case';
import { ObtenerLugaresConMasSiniestrosUseCase } from './obtener-lugares-con-mas-siniestros.use-case';
import { ObtenerMapaSiniestrosUseCase } from './obtener-mapa-siniestros.use-case';
import { ObtenerReportesDetalladosUseCase } from './obtener-reportes-detallados.use-case';
import { ObtenerReportesUseCase } from './obtener-reportes.use-case';
import { ObtenerSiniestrosDetalladosUseCase } from './obtener-siniestros-detallados.use-case';
import { ObtenerSiniestrosPorHoraUseCase } from './obtener-siniestros-por-hora.use-case';
import { ObtenerSiniestrosPorSexoYEdadUseCase } from './obtener-siniestros-por-sexo-y-edad.use-case';
import { ObtenerTarjetaUseCase } from './obtener-tarjeta.use-case';
import { ObtenerTendenciaMensualUseCase } from './obtener-tendencia-mensual.use-case';
import { ObtenerUsuariosPorTipoUseCase } from './obtener-usuarios-por-tipo.use-case';
import { TableroRepositoryPort } from './tablero.repository.port';

// Repositorio falso con una fila por consulta y los casos de uso reales encima para probar tambien sus calculos
function crearTablero(): TableroRepositoryPort {
  return {
    listarLocalidades: async () => [{ id: 4, nombre: 'Engativa' }],
    buscarRangoDeMeses: async () => ({ primerMes: null, ultimoMes: null }),
    buscarFechasDeCorte: async () => ({ anuario: null, ciclovias: null }),
    contarPorSemana: async () => [{ semana: '2026-08-03', total: 10 }],
    listarSiniestros: async () => [
      { id: 7, latitud: 4.7, longitud: -74.09, gravedad: 'con_heridos', clase: 'choque', tipoVehiculo: 'bicicleta_electrica', ocurridoEn: '2026-08-04T07:30', localidad: 'Engativa' },
    ],
    contarSiniestrosPorLugarYHora: async () => [{ lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 7, total: 3 }],
    contarSiniestrosPorMes: async () => [{ mes: '2026-08', total: 40 }],
    contarVictimasPorSexoYEdad: async () => [{ sexo: 'mujer', edad: 30, total: 2 }],
    contarUsuariosPorTipo: async () => [{ tipoVehiculo: 'bicicleta', total: 500 }],
    contarActivacionesPorLugar: async () => [{ lugar: 'Calle 26 x Cra. 30', localidad: 'Teusaquillo', latitud: 4.63, longitud: -74.08, total: 5 }],
    listarReportes: async () => [
      { id: 1, latitud: 4.6, longitud: -74.1, categoria: 'danos_en_la_via', localidad: 'Engativa', tipoVehiculo: 'bicicleta', mes: '2026-08' },
    ],
    contarFalsosPositivosPorMotivo: async () => [{ motivo: 'duplicado', total: 4 }],
    contarFalsosPositivosPorMes: async () => [{ mes: '2026-08', total: 4 }],
  };
}

function crearCasos(): CasosDeUsoKpi {
  const tablero = crearTablero();
  return {
    filtros: new ObtenerFiltrosUseCase(tablero),
    tarjeta: new ObtenerTarjetaUseCase(tablero),
    mapaSiniestros: new ObtenerMapaSiniestrosUseCase(tablero),
    lugaresConMasSiniestros: new ObtenerLugaresConMasSiniestrosUseCase(tablero),
    siniestrosPorHora: new ObtenerSiniestrosPorHoraUseCase(tablero),
    tendenciaMensual: new ObtenerTendenciaMensualUseCase(tablero),
    siniestrosPorSexoYEdad: new ObtenerSiniestrosPorSexoYEdadUseCase(tablero),
    usuariosPorTipo: new ObtenerUsuariosPorTipoUseCase(tablero),
    botonPanico: new ObtenerBotonPanicoUseCase(tablero),
    reportes: new ObtenerReportesUseCase(tablero),
    falsosPositivos: new ObtenerFalsosPositivosUseCase(tablero),
    siniestrosDetallados: new ObtenerSiniestrosDetalladosUseCase(tablero),
    reportesDetallados: new ObtenerReportesDetalladosUseCase(tablero),
  };
}

// Generador falso que guarda el libro que recibe y devuelve unos bytes cualquiera
class FakeGeneradorExcel implements GeneradorExcelPort {
  libro?: LibroExcel;

  async generar(libro: LibroExcel): Promise<Uint8Array> {
    this.libro = libro;
    return new Uint8Array([1, 2, 3]);
  }
}

describe('ExportarKpisUseCase', () => {
  const hoy = new Date(2026, 9, 20);
  const filtros = { periodo: Periodo.desdeFiltro(hoy, '2026-08', '2026-10') };

  it('crea una hoja de filtros y una hoja por cada KPI elegido en el orden del catalogo', async () => {
    const generador = new FakeGeneradorExcel();

    const archivo = await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['reportes', 'tarjeta_siniestros', 'reportes'],
      filtros,
    });

    expect(generador.libro?.hojas.map((hoja) => hoja.nombre)).toEqual(['Filtros aplicados', 'Tarjeta Siniestros', 'Reportes']);
    expect(archivo.nombre).toBe('kpis_2026-08_2026-10.xlsx');
    expect(archivo.contenido).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('la hoja de una tarjeta trae el valor la variacion y la serie semanal', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({ kpis: ['tarjeta_siniestros'], filtros });

    const [resumen, serie] = generador.libro?.hojas[1].secciones ?? [];
    expect(resumen.filas).toEqual([
      ['Valor del período', 10],
      ['Valor del período anterior', 10],
      ['Variación porcentual (%)', 0],
    ]);
    expect(serie.filas).toEqual([['2026-08-03', 10]]);
  });

  it('traduce los valores del negocio a texto legible y la localidad a su nombre', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['mapa_siniestros'],
      filtros: { ...filtros, localidadId: [4], tipoVehiculo: ['bicicleta_electrica'] },
    });

    const [hojaFiltros, hojaMapa] = generador.libro?.hojas ?? [];
    expect(hojaMapa.secciones[0].filas[0]).toEqual([7, '2026-08-04 07:30', 4.7, -74.09, 'Con heridos', 'Choque', 'Bicicleta electrica', 'Engativa', 'Secretaría Distrital de Movilidad']);
    expect(hojaFiltros.secciones[0].filas).toEqual([
      ['Mes desde', '2026-08'],
      ['Mes hasta', '2026-10'],
      ['Localidad', 'Engativa'],
      ['Tipo de vehículo', 'Bicicleta electrica'],
      ['Fuente', 'Todas'],
    ]);
  });

  it('la hoja de filtros muestra separados por coma los varios valores de cada filtro', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['tarjeta_siniestros'],
      filtros: { ...filtros, localidadId: [4, 9], tipoVehiculo: ['bicicleta', 'patineta'], fuente: ['app'] },
    });

    const [hojaFiltros] = generador.libro?.hojas ?? [];
    expect(hojaFiltros.secciones[0].filas.slice(2)).toEqual([
      ['Localidad', 'Engativa, Id 9'],
      ['Tipo de vehículo', 'Bicicleta, Patineta'],
      ['Fuente', 'App'],
    ]);
  });

  it('con un solo valor por filtro las hojas agregadas no cambian de columnas', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['siniestros_por_sexo_y_edad'],
      filtros: { ...filtros, localidadId: [4], tipoVehiculo: ['bicicleta'] },
    });

    const [resumen, rangos] = generador.libro?.hojas[1].secciones ?? [];
    expect(resumen.columnas).toEqual(['Dato', 'Valor']);
    expect(rangos.columnas).toEqual(['Rango de edad', 'Mujeres', 'Hombres']);
  });

  it('con varias localidades separa cada fila agregada por localidad y calcula cada una con su propio filtro', async () => {
    const generador = new FakeGeneradorExcel();
    const tablero = crearTablero();
    // Cada localidad devuelve un total distinto para comprobar que se calculo por separado
    tablero.contarVictimasPorSexoYEdad = async (f) => [{ sexo: 'mujer', edad: 30, total: f.localidadId?.[0] ?? 0 }];
    const casos = { ...crearCasos(), siniestrosPorSexoYEdad: new ObtenerSiniestrosPorSexoYEdadUseCase(tablero) };

    await new ExportarKpisUseCase(casos, generador).execute({
      kpis: ['siniestros_por_sexo_y_edad'],
      filtros: { ...filtros, localidadId: [4, 9] },
    });

    const [resumen, rangos] = generador.libro?.hojas[1].secciones ?? [];
    expect(resumen.columnas).toEqual(['Localidad', 'Dato', 'Valor']);
    expect(resumen.filas).toEqual([
      ['Engativa', 'Total de mujeres', 4],
      ['Engativa', 'Total de hombres', 0],
      ['Id 9', 'Total de mujeres', 9],
      ['Id 9', 'Total de hombres', 0],
    ]);
    expect(rangos.columnas).toEqual(['Localidad', 'Rango de edad', 'Mujeres', 'Hombres']);
    expect(rangos.filas.filter((fila) => fila[1] === '26-35')).toEqual([
      ['Engativa', '26-35', 4, 0],
      ['Id 9', '26-35', 9, 0],
    ]);
  });

  it('con varios valores en varios filtros separa por cada combinacion', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['tendencia_mensual'],
      filtros: { ...filtros, localidadId: [4, 9], tipoVehiculo: ['bicicleta', 'patineta'], fuente: ['anuario', 'app'] },
    });

    const [tabla] = generador.libro?.hojas[1].secciones ?? [];
    expect(tabla.columnas.slice(0, 4)).toEqual(['Localidad', 'Tipo de vehículo', 'Fuente', 'Mes']);
    // Ocho combinaciones con los doce meses de la tendencia cada una
    expect(tabla.filas).toHaveLength(8 * 12);
    expect(tabla.filas[0].slice(0, 3)).toEqual(['Engativa', 'Bicicleta', 'Secretaría Distrital de Movilidad']);
    expect(tabla.filas[95].slice(0, 3)).toEqual(['Id 9', 'Patineta', 'App']);
  });

  it('no repite la columna Localidad en las hojas que ya la traen pero igual separa por localidad', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({
      kpis: ['lugares_con_mas_siniestros'],
      filtros: { ...filtros, localidadId: [4, 9], tipoVehiculo: ['bicicleta', 'patineta'] },
    });

    const [tabla] = generador.libro?.hojas[1].secciones ?? [];
    expect(tabla.columnas).toEqual(['Tipo de vehículo', 'Posición', 'Lugar', 'Localidad', 'Franja pico', 'Total']);
    expect(tabla.filas).toHaveLength(4);
  });

  it('las hojas de registros traen en cada fila su mes localidad tipo de vehiculo y fuente', async () => {
    const generador = new FakeGeneradorExcel();

    await new ExportarKpisUseCase(crearCasos(), generador).execute({ kpis: ['reportes'], filtros });

    const secciones = generador.libro?.hojas[1].secciones ?? [];
    expect(secciones.map((s) => s.titulo)).toEqual(['Resumen', 'Por categoría', 'Reportes en el mapa']);
    expect(secciones[2].columnas).toEqual(['Id', 'Latitud', 'Longitud', 'Categoría', 'Mes', 'Localidad', 'Tipo de vehículo', 'Fuente']);
    expect(secciones[2].filas[0]).toEqual([1, 4.6, -74.1, 'Danos en la via', '2026-08', 'Engativa', 'Bicicleta', 'App']);
  });

  it('genera una hoja con nombre valido para Excel por cada KPI del catalogo', async () => {
    const generador = new FakeGeneradorExcel();
    const todos = [
      'tarjeta_siniestros', 'tarjeta_usuarios', 'tarjeta_reportes', 'tarjeta_boton_panico', 'tarjeta_falsos_positivos',
      'mapa_siniestros', 'lugares_con_mas_siniestros', 'siniestros_por_hora', 'tendencia_mensual',
      'siniestros_por_sexo_y_edad', 'usuarios_por_tipo', 'boton_panico', 'reportes', 'falsos_positivos',
    ];

    await new ExportarKpisUseCase(crearCasos(), generador).execute({ kpis: todos, filtros });

    const nombres = generador.libro?.hojas.map((hoja) => hoja.nombre) ?? [];
    expect(nombres).toHaveLength(15);
    expect(new Set(nombres).size).toBe(15);
    expect(nombres.every((nombre) => nombre.length <= 31)).toBe(true);
  });

  it('rechaza una seleccion vacia o con un KPI que no existe', async () => {
    const caso = new ExportarKpisUseCase(crearCasos(), new FakeGeneradorExcel());

    await expect(caso.execute({ kpis: [], filtros })).rejects.toMatchObject({ codigo: 'KPIS_VACIOS' });
    await expect(caso.execute({ kpis: ['otro'], filtros })).rejects.toMatchObject({ codigo: 'KPI_INVALIDO' });
  });
});
