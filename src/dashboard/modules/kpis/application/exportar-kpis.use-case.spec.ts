import { Periodo } from '../domain/periodo';
import { ExportarKpisUseCase } from './exportar-kpis.use-case';
import { GeneradorExcelPort, LibroExcel } from './generador-excel.port';
import { CasosDeUsoKpi } from './hojas-excel-kpis';
import { ObtenerBotonPanicoUseCase } from './obtener-boton-panico.use-case';
import { ObtenerFalsosPositivosUseCase } from './obtener-falsos-positivos.use-case';
import { ObtenerFiltrosUseCase } from './obtener-filtros.use-case';
import { ObtenerLugaresConMasSiniestrosUseCase } from './obtener-lugares-con-mas-siniestros.use-case';
import { ObtenerMapaSiniestrosUseCase } from './obtener-mapa-siniestros.use-case';
import { ObtenerReportesUseCase } from './obtener-reportes.use-case';
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
    buscarUltimoMesConDatos: async () => null,
    contarPorSemana: async () => [{ semana: '2026-08-03', total: 10 }],
    listarSiniestros: async () => [
      { id: 7, latitud: 4.7, longitud: -74.09, gravedad: 'con_heridos', clase: 'choque', tipoVehiculo: 'bicicleta_electrica', ocurridoEn: '2026-08-04T07:30' },
    ],
    contarSiniestrosPorLugarYHora: async () => [{ lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 7, total: 3 }],
    contarSiniestrosPorMes: async () => [{ mes: '2026-08', total: 40 }],
    contarVictimasPorSexoYEdad: async () => [{ sexo: 'mujer', edad: 30, total: 2 }],
    contarUsuariosPorTipo: async () => [{ tipoVehiculo: 'bicicleta', total: 500 }],
    contarActivacionesPorLugar: async () => [{ lugar: 'Calle 26 x Cra. 30', localidad: 'Teusaquillo', latitud: 4.63, longitud: -74.08, total: 5 }],
    listarReportes: async () => [{ id: 1, latitud: 4.6, longitud: -74.1, categoria: 'danos_en_la_via' }],
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
    expect(hojaMapa.secciones[0].filas[0]).toEqual([7, '2026-08-04 07:30', 4.7, -74.09, 'Con heridos', 'Choque', 'Bicicleta electrica']);
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
