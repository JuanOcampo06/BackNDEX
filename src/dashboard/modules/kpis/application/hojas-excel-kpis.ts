import { Indicador } from '../domain/catalogos';
import { FiltrosTablero } from '../domain/filtros-tablero';
import { KpiExportable } from '../domain/kpis-exportables';
import { CeldaExcel, HojaExcel } from './generador-excel.port';
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

// Los mismos casos de uso que alimentan el tablero asi el Excel trae exactamente las cifras que se ven en pantalla
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
}

type ConstructorHoja = (casos: CasosDeUsoKpi, filtros: FiltrosTablero) => Promise<HojaExcel>;

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

// Valores como danos_en_la_via se muestran como Danos en la via
function etiqueta(valor: string): string {
  const texto = valor.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function hojaDeTarjeta(nombre: string, indicador: Indicador): ConstructorHoja {
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
    return {
      nombre,
      secciones: [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: resumen },
        {
          titulo: 'Serie semanal',
          columnas: ['Semana (inicia el lunes)', 'Total'],
          filas: tarjeta.serieSemanal.map((semana) => [semana.semana, semana.total]),
        },
      ],
    };
  };
}

// Cada KPI sabe armar su hoja y el orden de las hojas lo da el catalogo de KPIs exportables
export const CONSTRUCTORES_HOJA: Record<KpiExportable, ConstructorHoja> = {
  tarjeta_siniestros: hojaDeTarjeta('Tarjeta Siniestros', 'siniestros'),
  tarjeta_usuarios: hojaDeTarjeta('Tarjeta Usuarios', 'usuarios'),
  tarjeta_reportes: hojaDeTarjeta('Tarjeta Reportes', 'reportes'),
  tarjeta_boton_panico: hojaDeTarjeta('Tarjeta Botón de pánico', 'boton_panico'),
  tarjeta_falsos_positivos: hojaDeTarjeta('Tarjeta Falsos positivos', 'falsos_positivos'),

  mapa_siniestros: async (casos, filtros) => {
    const { siniestros } = await casos.mapaSiniestros.execute(filtros);
    return {
      nombre: 'Mapa de siniestros',
      secciones: [
        {
          columnas: ['Id', 'Fecha y hora', 'Latitud', 'Longitud', 'Gravedad', 'Clase', 'Tipo de vehículo'],
          filas: siniestros.map((s) => [
            s.id,
            s.ocurridoEn.replace('T', ' '),
            s.latitud,
            s.longitud,
            etiqueta(s.gravedad),
            etiqueta(s.clase),
            etiqueta(s.tipoVehiculo),
          ]),
        },
      ],
    };
  },

  lugares_con_mas_siniestros: async (casos, filtros) => {
    const lugares = await casos.lugaresConMasSiniestros.execute(filtros);
    return {
      nombre: 'Lugares con más siniestros',
      secciones: [
        {
          columnas: ['Posición', 'Lugar', 'Localidad', 'Franja pico', 'Total'],
          filas: lugares.map((l) => [l.posicion, l.lugar, l.localidad, etiqueta(l.franjaPico), l.total]),
        },
      ],
    };
  },

  siniestros_por_hora: async (casos, filtros) => {
    const horas = await casos.siniestrosPorHora.execute(filtros);
    return {
      nombre: 'Siniestros por hora',
      secciones: [
        { columnas: ['Hora (0 a 23)', 'Franja', 'Total'], filas: horas.map((h) => [h.hora, etiqueta(h.franja), h.total]) },
      ],
    };
  },

  tendencia_mensual: async (casos, filtros) => {
    const tendencia = await casos.tendenciaMensual.execute(filtros);
    return {
      nombre: 'Tendencia mensual',
      secciones: [
        {
          columnas: ['Mes', `Total ${tendencia.anioActual}`, `Total ${tendencia.anioAnterior}`],
          filas: tendencia.meses.map((m) => [NOMBRES_MES[m.mes - 1], m.totalAnioActual, m.totalAnioAnterior]),
        },
      ],
    };
  },

  siniestros_por_sexo_y_edad: async (casos, filtros) => {
    const datos = await casos.siniestrosPorSexoYEdad.execute(filtros);
    return {
      nombre: 'Siniestros por sexo y edad',
      secciones: [
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
      ],
    };
  },

  usuarios_por_tipo: async (casos, filtros) => {
    const datos = await casos.usuariosPorTipo.execute(filtros);
    return {
      nombre: 'Usuarios por tipo',
      secciones: [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de usuarios', datos.total]] },
        {
          titulo: 'Por tipo de vehículo',
          columnas: ['Tipo de vehículo', 'Total'],
          filas: datos.tipos.map((t) => [etiqueta(t.tipoVehiculo), t.total]),
        },
      ],
    };
  },

  boton_panico: async (casos, filtros) => {
    const datos = await casos.botonPanico.execute(filtros);
    return {
      nombre: 'Botón de pánico',
      secciones: [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de activaciones', datos.total]] },
        {
          titulo: 'Activaciones por lugar',
          columnas: ['Lugar', 'Localidad', 'Latitud', 'Longitud', 'Activaciones'],
          filas: datos.lugares.map((l) => [l.lugar, l.localidad, l.latitud, l.longitud, l.total]),
        },
      ],
    };
  },

  reportes: async (casos, filtros) => {
    const datos = await casos.reportes.execute(filtros);
    return {
      nombre: 'Reportes',
      secciones: [
        { titulo: 'Resumen', columnas: ['Dato', 'Valor'], filas: [['Total de reportes', datos.total]] },
        {
          titulo: 'Por categoría',
          columnas: ['Categoría', 'Total'],
          filas: datos.porCategoria.map((c) => [etiqueta(c.categoria), c.total]),
        },
        {
          titulo: 'Reportes en el mapa',
          columnas: ['Id', 'Latitud', 'Longitud', 'Categoría'],
          filas: datos.puntos.map((p) => [p.id, p.latitud, p.longitud, etiqueta(p.categoria)]),
        },
      ],
    };
  },

  falsos_positivos: async (casos, filtros) => {
    const datos = await casos.falsosPositivos.execute(filtros);
    return {
      nombre: 'Falsos positivos',
      secciones: [
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
      ],
    };
  },
};

// Los valores elegidos salen separados por coma y sin ninguno el filtro no se aplico
function valoresOTodos(valores: readonly string[] | undefined, textoDeTodos: string): string {
  return valores === undefined || valores.length === 0 ? textoDeTodos : valores.join(', ');
}

// Primera hoja del libro con los filtros con los que se calcularon las cifras y la lista de hojas incluidas
export function hojaDeFiltros(
  filtros: FiltrosTablero,
  localidades: readonly { id: number; nombre: string }[],
  hojas: readonly HojaExcel[],
): HojaExcel {
  const meses = filtros.periodo.meses();
  const nombreDeLocalidad = (id: number) => localidades.find((l) => l.id === id)?.nombre ?? `Id ${id}`;
  return {
    nombre: 'Filtros aplicados',
    secciones: [
      {
        titulo: 'Filtros del tablero',
        columnas: ['Filtro', 'Valor'],
        filas: [
          ['Mes desde', meses[0]],
          ['Mes hasta', meses[meses.length - 1]],
          ['Localidad', valoresOTodos(filtros.localidadId?.map(nombreDeLocalidad), 'Todas')],
          ['Tipo de vehículo', valoresOTodos(filtros.tipoVehiculo?.map((tipo) => etiqueta(tipo)), 'Todos')],
          ['Fuente', valoresOTodos(filtros.fuente?.map((fuente) => etiqueta(fuente)), 'Todas')],
        ],
      },
      { titulo: 'Hojas incluidas', columnas: ['Hoja'], filas: hojas.map((hoja) => [hoja.nombre]) },
    ],
  };
}
