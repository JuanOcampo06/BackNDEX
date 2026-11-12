import { Fuente, Indicador, TipoVehiculo } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { NOMBRE_DE_FUENTE } from '../domain/fuentes-de-datos';
import { KpiExportable } from '../domain/kpis-exportables';
import { CeldaExcel, HojaExcel, SeccionExcel } from './generador-excel.port';
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
import { Localidad } from './tablero.repository.port';

// Los mismos casos de uso que alimentan el tablero asi el Excel trae exactamente las cifras que se ven en pantalla
// los detallados traen los registros uno por uno con su localidad para las hojas de registros
export interface CasosDeUsoKpi {
  filtros: ObtenerFiltrosUseCase;
  tarjeta: ObtenerTarjetaUseCase;
  mapaSiniestros: ObtenerMapaSiniestrosUseCase;
  lugaresConMasSiniestros: ObtenerLugaresConMasSiniestrosUseCase;
  siniestrosPorHora: ObtenerSiniestrosPorHoraUseCase;
  tendenciaMensual: ObtenerTendenciaMensualUseCase;
  siniestrosPorSexoYEdad: ObtenerSiniestrosPorSexoYEdadUseCase;
  usuariosPorTipo: ObtenerUsuariosPorTipoUseCase;
  botonPanico: ObtenerBotonPanicoUseCase;
  reportes: ObtenerReportesUseCase;
  falsosPositivos: ObtenerFalsosPositivosUseCase;
  siniestrosDetallados: ObtenerSiniestrosDetalladosUseCase;
  reportesDetallados: ObtenerReportesDetalladosUseCase;
}

type ArmarSecciones = (casos: CasosDeUsoKpi, filtros: FiltrosTablero) => Promise<SeccionExcel[]>;

// Cada hoja tiene secciones agregadas que se separan por los filtros con varios valores
// y secciones de registros uno por uno que ya traen en cada fila su localidad vehiculo y fuente
interface DefinicionHoja {
  nombre: string;
  agregadas?: ArmarSecciones;
  registros?: ArmarSecciones;
}

const NOMBRES_MES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

// Fuente de los registros de cada hoja de registros
const FUENTE_SINIESTROS: Fuente = 'anuario';
const FUENTE_REPORTES: Fuente = 'app';

// Valores como danos_en_la_via se muestran como Danos en la via
function etiqueta(valor: string): string {
  const texto = valor.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function seccionesDeTarjeta(indicador: Indicador): ArmarSecciones {
  return async (casos, filtros) => {
    const tarjeta = await casos.tarjeta.execute(indicador, filtros);
    const resumen: CeldaExcel[][] = [
      ['Valor del período', tarjeta.valor],
      ['Valor del período anterior', tarjeta.valorPeriodoAnterior],
      ['Variación porcentual (%)', tarjeta.variacionPorcentual],
    ];
    if (tarjeta.porcentajeDeReportes !== undefined) {
      resumen.push(['Porcentaje de los reportes (%)', tarjeta.porcentajeDeReportes]);
    }
    return [
      { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: resumen },
      {
        titulo: 'Serie semanal',
        columnas: ['Semana (inicia el lunes)', 'Total'],
        filas: tarjeta.serieSemanal.map((semana) => [semana.semana, semana.total]),
      },
    ];
  };
}

// Cada KPI dice como se arma su hoja y el orden de las hojas lo da el catalogo de KPIs exportables
const DEFINICIONES_HOJA: Record<KpiExportable, DefinicionHoja> = {
  tarjeta_siniestros: { nombre: 'Tarjeta Siniestros', agregadas: seccionesDeTarjeta('siniestros') },
  tarjeta_usuarios: { nombre: 'Tarjeta Usuarios', agregadas: seccionesDeTarjeta('usuarios') },
  tarjeta_reportes: { nombre: 'Tarjeta Reportes', agregadas: seccionesDeTarjeta('reportes') },
  tarjeta_boton_panico: { nombre: 'Tarjeta Botón de pánico', agregadas: seccionesDeTarjeta('boton_panico') },
  tarjeta_falsos_positivos: { nombre: 'Tarjeta Falsos positivos', agregadas: seccionesDeTarjeta('falsos_positivos') },

  // La fecha y hora ya dice el mes por eso no lleva columna Mes
  mapa_siniestros: {
    nombre: 'Mapa de siniestros',
    registros: async (casos, filtros) => {
      const siniestros = await casos.siniestrosDetallados.execute(filtros);
      return [
        {
          columnas: ['Id', 'Fecha y hora', 'Latitud', 'Longitud', 'Gravedad', 'Clase', 'Tipo de vehículo', 'Localidad', 'Fuente'],
          filas: siniestros.map((s) => [
            s.id,
            s.ocurridoEn.replace('T', ' '),
            s.latitud,
            s.longitud,
            etiqueta(s.gravedad),
            etiqueta(s.clase),
            etiqueta(s.tipoVehiculo),
            s.localidad,
            NOMBRE_DE_FUENTE[FUENTE_SINIESTROS],
          ]),
        },
      ];
    },
  },

  lugares_con_mas_siniestros: {
    nombre: 'Lugares con más siniestros',
    agregadas: async (casos, filtros) => {
      const lugares = await casos.lugaresConMasSiniestros.execute(filtros);
      return [
        {
          columnas: ['Posición', 'Lugar', 'Localidad', 'Franja pico', 'Total'],
          filas: lugares.map((l) => [l.posicion, l.lugar, l.localidad, etiqueta(l.franjaPico), l.total]),
        },
      ];
    },
  },

  siniestros_por_hora: {
    nombre: 'Siniestros por hora',
    agregadas: async (casos, filtros) => {
      const horas = await casos.siniestrosPorHora.execute(filtros);
      return [{ columnas: ['Hora (0 a 23)', 'Franja', 'Total'], filas: horas.map((h) => [h.hora, etiqueta(h.franja), h.total]) }];
    },
  },

  tendencia_mensual: {
    nombre: 'Tendencia mensual',
    agregadas: async (casos, filtros) => {
      const tendencia = await casos.tendenciaMensual.execute(filtros);
      return [
        {
          columnas: ['Mes', `Total ${tendencia.anioActual}`, `Total ${tendencia.anioAnterior}`],
          filas: tendencia.meses.map((m) => [NOMBRES_MES[m.mes - 1], m.totalAnioActual, m.totalAnioAnterior]),
        },
      ];
    },
  },

  siniestros_por_sexo_y_edad: {
    nombre: 'Siniestros por sexo y edad',
    agregadas: async (casos, filtros) => {
      const datos = await casos.siniestrosPorSexoYEdad.execute(filtros);
      return [
        {
          titulo: 'Resumen',
          columnas: ['Dato', 'Valor'],
          filas: [
            ['Total de mujeres', datos.totalMujer],
            ['Total de hombres', datos.totalHombre],
          ],
        },
        {
          titulo: 'Por rango de edad',
          columnas: ['Rango de edad', 'Mujeres', 'Hombres'],
          filas: datos.rangos.map((r) => [r.rango, r.mujer, r.hombre]),
        },
      ];
    },
  },

  usuarios_por_tipo: {
    nombre: 'Usuarios por tipo',
    agregadas: async (casos, filtros) => {
      const datos = await casos.usuariosPorTipo.execute(filtros);
      return [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de usuarios', datos.total]] },
        {
          titulo: 'Por tipo de vehículo',
          columnas: ['Tipo de vehículo', 'Total'],
          filas: datos.tipos.map((t) => [etiqueta(t.tipoVehiculo), t.total]),
        },
      ];
    },
  },

  boton_panico: {
    nombre: 'Botón de pánico',
    agregadas: async (casos, filtros) => {
      const datos = await casos.botonPanico.execute(filtros);
      return [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de activaciones', datos.total]] },
        {
          titulo: 'Activaciones por lugar',
          columnas: ['Lugar', 'Localidad', 'Latitud', 'Longitud', 'Activaciones'],
          filas: datos.lugares.map((l) => [l.lugar, l.localidad, l.latitud, l.longitud, l.total]),
        },
      ];
    },
  },

  reportes: {
    nombre: 'Reportes',
    agregadas: async (casos, filtros) => {
      const datos = await casos.reportes.execute(filtros);
      return [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de reportes', datos.total]] },
        {
          titulo: 'Por categoría',
          columnas: ['Categoría', 'Total'],
          filas: datos.porCategoria.map((c) => [etiqueta(c.categoria), c.total]),
        },
      ];
    },
    registros: async (casos, filtros) => {
      const reportes = await casos.reportesDetallados.execute(filtros);
      return [
        {
          titulo: 'Reportes en el mapa',
          columnas: ['Id', 'Latitud', 'Longitud', 'Categoría', 'Mes', 'Localidad', 'Tipo de vehículo', 'Fuente'],
          filas: reportes.map((r) => [
            r.id,
            r.latitud,
            r.longitud,
            etiqueta(r.categoria),
            r.mes,
            r.localidad,
            etiqueta(r.tipoVehiculo),
            NOMBRE_DE_FUENTE[FUENTE_REPORTES],
          ]),
        },
      ];
    },
  },

  falsos_positivos: {
    nombre: 'Falsos positivos',
    agregadas: async (casos, filtros) => {
      const datos = await casos.falsosPositivos.execute(filtros);
      return [
        {
          titulo: 'Resumen',
          columnas: ['Dato', 'Valor'],
          filas: [
            ['Total de falsos positivos', datos.total],
            ['Porcentaje de los reportes (%)', datos.porcentajeDeReportes],
          ],
        },
        {
          titulo: 'Por motivo',
          columnas: ['Motivo', 'Total', 'Porcentaje (%)'],
          filas: datos.porMotivo.map((m) => [etiqueta(m.motivo), m.total, m.porcentaje]),
        },
        {
          titulo: 'Evolución mensual',
          columnas: ['Mes', 'Total'],
          filas: datos.evolucionMensual.map((m) => [m.mes, m.total]),
        },
      ];
    },
  },
};

// Una combinacion de valores de los filtros con varios valores y los filtros que la calculan
interface Grupo {
  etiquetas: string[];
  filtros: FiltrosTablero;
}

// Un filtro con mas de un valor elegido se vuelve una columna y cada valor una opcion
interface Separacion {
  columna: string;
  opciones: { etiqueta: string; aplicar: (filtros: FiltrosTablero) => FiltrosTablero }[];
}

function separaciones(filtros: FiltrosTablero, localidades: readonly Localidad[]): Separacion[] {
  const resultado: Separacion[] = [];
  if ((filtros.localidadId?.length ?? 0) > 1) {
    resultado.push({
      columna: 'Localidad',
      opciones: (filtros.localidadId ?? []).map((id) => ({
        etiqueta: nombreDeLocalidad(localidades, id),
        aplicar: (f) => ({ ...f, localidadId: [id] }),
      })),
    });
  }
  if ((filtros.tipoVehiculo?.length ?? 0) > 1) {
    resultado.push({
      columna: 'Tipo de vehículo',
      opciones: (filtros.tipoVehiculo ?? []).map((tipo: TipoVehiculo) => ({
        etiqueta: etiqueta(tipo),
        aplicar: (f) => ({ ...f, tipoVehiculo: [tipo] }),
      })),
    });
  }
  if ((filtros.fuente?.length ?? 0) > 1) {
    resultado.push({
      columna: 'Fuente',
      opciones: (filtros.fuente ?? []).map((fuente: Fuente) => ({
        etiqueta: NOMBRE_DE_FUENTE[fuente],
        aplicar: (f) => ({ ...f, fuente: [fuente] }),
      })),
    });
  }
  return resultado;
}

// Todas las combinaciones de los valores elegidos y sin filtros con varios valores queda un solo grupo sin columnas
function combinar(filtros: FiltrosTablero, partes: Separacion[]): Grupo[] {
  return partes.reduce<Grupo[]>(
    (grupos, parte) =>
      grupos.flatMap((grupo) =>
        parte.opciones.map((opcion) => ({ etiquetas: [...grupo.etiquetas, opcion.etiqueta], filtros: opcion.aplicar(grupo.filtros) })),
      ),
    [{ etiquetas: [], filtros }],
  );
}

// Calcula las secciones agregadas una vez por grupo y las une poniendo delante las columnas de los filtros separados
async function seccionesSeparadas(
  armar: ArmarSecciones,
  casos: CasosDeUsoKpi,
  filtros: FiltrosTablero,
  localidades: readonly Localidad[],
): Promise<SeccionExcel[]> {
  const partes = separaciones(filtros, localidades);
  const grupos = combinar(filtros, partes);
  const resultados = await Promise.all(grupos.map((grupo) => armar(casos, grupo.filtros)));
  return resultados[0].map((seccion, indice) => {
    // Si la seccion ya trae esa columna como Localidad en lugares no se repite pero las filas igual van separadas
    const usadas = partes.map((parte) => !seccion.columnas.includes(parte.columna));
    const extra = (valores: string[]) => valores.filter((_valor, i) => usadas[i]);
    return {
      titulo: seccion.titulo,
      columnas: [...extra(partes.map((parte) => parte.columna)), ...seccion.columnas],
      filas: grupos.flatMap((grupo, k) => resultados[k][indice].filas.map((fila) => [...extra(grupo.etiquetas), ...fila])),
    };
  });
}

// Arma la hoja de un KPI con sus secciones agregadas primero y luego las de registros
export async function armarHoja(
  kpi: KpiExportable,
  casos: CasosDeUsoKpi,
  filtros: FiltrosTablero,
  localidades: readonly Localidad[],
): Promise<HojaExcel> {
  const definicion = DEFINICIONES_HOJA[kpi];
  const [agregadas, registros] = await Promise.all([
    definicion.agregadas ? seccionesSeparadas(definicion.agregadas, casos, filtros, localidades) : [],
    definicion.registros ? definicion.registros(casos, filtros) : [],
  ]);
  return { nombre: definicion.nombre, secciones: [...agregadas, ...registros] };
}

function nombreDeLocalidad(localidades: readonly Localidad[], id: number): string {
  return localidades.find((l) => l.id === id)?.nombre ?? `Id ${id}`;
}

// Los valores elegidos salen separados por coma y sin ninguno el filtro no se aplico
function valoresOTodos(valores: readonly string[] | undefined, textoDeTodos: string): string {
  return valores === undefined || valores.length === 0 ? textoDeTodos : valores.join(', ');
}

// Primera hoja del libro con los filtros con los que se calcularon las cifras y la lista de hojas incluidas
export function hojaDeFiltros(
  filtros: FiltrosTablero,
  localidades: readonly Localidad[],
  hojas: readonly HojaExcel[],
): HojaExcel {
  const meses = filtros.periodo.meses();
  return {
    nombre: 'Filtros aplicados',
    secciones: [
      {
        titulo: 'Filtros del tablero',
        columnas: ['Filtro', 'Valor'],
        filas: [
          ['Mes desde', meses[0]],
          ['Mes hasta', meses[meses.length - 1]],
          ['Localidad', valoresOTodos(filtros.localidadId?.map((id) => nombreDeLocalidad(localidades, id)), 'Todas')],
          ['Tipo de vehículo', valoresOTodos(filtros.tipoVehiculo?.map((tipo) => etiqueta(tipo)), 'Todos')],
          ['Fuente', valoresOTodos(filtros.fuente?.map((fuente) => NOMBRE_DE_FUENTE[fuente]), 'Todas')],
        ],
      },
      { titulo: 'Hojas incluidas', columnas: ['Hoja'], filas: hojas.map((hoja) => [hoja.nombre]) },
    ],
  };
}
