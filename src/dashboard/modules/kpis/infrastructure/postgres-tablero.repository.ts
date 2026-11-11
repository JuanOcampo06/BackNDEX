import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import {
  ConteoLugarHora,
  ConteoMensual,
  ConteoPorLugar,
  ConteoPorMotivo,
  ConteoPorTipo,
  ConteoSemanal,
  ConteoSexoEdad,
  Localidad,
  ReporteDetallado,
  SiniestroDetallado,
  TableroRepositoryPort,
} from '../application/tablero.repository.port';
import { Fuente, Indicador } from '../domain/catalogos';
import { FiltrosTablero, incluyeFuente } from '../domain/filtros-tablero';

// Describe de que tabla sale cada cifra y que columna usa cada filtro
interface Origen {
  tabla: string;
  fecha: string;
  valor: string;
  localidad: string;
  fuente: Fuente;
  vehiculo?: string;
  condicion?: string;
}

// Siniestros son solo del tablero y viven en el schema dashboard
// reportes activaciones y conteos de usuarios son tablas del schema compartido que llena la app movil
// cada siniestro del anuario trae su propia localidad y puede faltar por eso se une con LEFT JOIN
const SINIESTROS: Origen = {
  tabla:
    'dashboard.siniestros s JOIN compartido.lugares l ON l.id = s.lugar_id LEFT JOIN compartido.localidades lo ON lo.id = s.localidad_id',
  fecha: 's.ocurrido_en',
  valor: 'count(*)',
  localidad: 's.localidad_id',
  fuente: 'anuario',
  vehiculo: 's.tipo_vehiculo',
};

const USUARIOS: Origen = {
  tabla: 'compartido.conteos_usuarios c',
  fecha: 'c.fecha',
  valor: 'sum(c.cantidad)',
  localidad: 'c.localidad_id',
  fuente: 'app',
  vehiculo: 'c.tipo_vehiculo',
};

const REPORTES: Origen = {
  tabla:
    'compartido.reportes r JOIN compartido.lugares l ON l.id = r.lugar_id LEFT JOIN compartido.localidades lo ON lo.id = l.localidad_id',
  fecha: 'r.creado_en',
  valor: 'count(*)',
  localidad: 'l.localidad_id',
  fuente: 'app',
  vehiculo: 'r.tipo_vehiculo',
};

const FALSOS_POSITIVOS: Origen = { ...REPORTES, condicion: 'r.motivo_falso_positivo IS NOT NULL' };

const PANICO: Origen = {
  tabla:
    'compartido.activaciones_panico a JOIN compartido.lugares l ON l.id = a.lugar_id LEFT JOIN compartido.localidades lo ON lo.id = l.localidad_id',
  fecha: 'a.activado_en',
  valor: 'count(*)',
  localidad: 'l.localidad_id',
  fuente: 'app',
  vehiculo: 'a.tipo_vehiculo',
};

const ORIGEN_POR_INDICADOR: Record<Indicador, Origen> = {
  siniestros: SINIESTROS,
  usuarios: USUARIOS,
  reportes: REPORTES,
  boton_panico: PANICO,
  falsos_positivos: FALSOS_POSITIVOS,
};

interface Condiciones {
  donde: string;
  valores: unknown[];
}

// Nombre que se muestra cuando el anuario no trae la localidad
const SIN_LOCALIDAD = `coalesce(lo.nombre, 'Sin localidad')`;

// Arma el WHERE con parametros para no pegar texto del usuario dentro del SQL
function armarCondiciones(origen: Origen, filtros: FiltrosTablero): Condiciones {
  const valores: unknown[] = [filtros.periodo.fechaInicio(), filtros.periodo.fechaFinExclusiva()];
  const condiciones = [`${origen.fecha} >= $1`, `${origen.fecha} < $2`];
  // Cada filtro es una lista y ANY deja pasar los registros que coinciden con cualquiera de sus valores
  const agregar = (columna: string | undefined, lista: readonly unknown[] | undefined) => {
    if (columna && lista !== undefined && lista.length > 0) {
      valores.push(lista);
      condiciones.push(`${columna} = ANY($${valores.length})`);
    }
  };
  agregar(origen.localidad, filtros.localidadId);
  agregar(origen.vehiculo, filtros.tipoVehiculo);
  // Si la fuente de esta cifra no esta elegida la consulta no trae filas y la grafica queda en cero
  if (!incluyeFuente(filtros, origen.fuente)) {
    condiciones.push('false');
  }
  if (origen.condicion) {
    condiciones.push(origen.condicion);
  }
  return { donde: condiciones.join(' AND '), valores };
}

// Adaptador que lee los datos del tablero desde PostgreSQL
// los alias entre comillas dejan cada fila con la misma forma que pide el puerto
@Injectable()
export class PostgresTableroRepository implements TableroRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  listarLocalidades(): Promise<Localidad[]> {
    return this.consultar('SELECT id, nombre FROM compartido.localidades ORDER BY nombre', []);
  }

  async buscarUltimoMesConDatos(fuentes: readonly Fuente[]): Promise<string | null> {
    // Se toma la fecha mas reciente de cada tabla cuya fuente este elegida
    const fechas = Object.values(ORIGEN_POR_INDICADOR)
      .filter((origen) => fuentes.includes(origen.fuente))
      .map((origen) => `SELECT max(${origen.fecha})::date AS fecha FROM ${origen.tabla}`);
    const [fila] = await this.consultar<{ mes: string | null }>(
      `SELECT to_char(max(fecha), 'YYYY-MM') AS mes FROM (${fechas.join(' UNION ALL ')}) AS ultimas`,
      [],
    );
    return fila.mes;
  }

  contarPorSemana(indicador: Indicador, filtros: FiltrosTablero): Promise<ConteoSemanal[]> {
    const origen = ORIGEN_POR_INDICADOR[indicador];
    const { donde, valores } = armarCondiciones(origen, filtros);
    return this.consultar(
      `SELECT to_char(date_trunc('week', ${origen.fecha}), 'YYYY-MM-DD') AS semana, ${origen.valor}::int AS total
       FROM ${origen.tabla} WHERE ${donde} GROUP BY 1 ORDER BY 1`,
      valores,
    );
  }

  listarSiniestros(filtros: FiltrosTablero): Promise<SiniestroDetallado[]> {
    const { donde, valores } = armarCondiciones(SINIESTROS, filtros);
    return this.consultar(
      // El id del anuario es bigint y postgres lo entrega como texto por eso se convierte a int que le alcanza
      `SELECT s.id::int AS id, s.latitud, s.longitud, s.gravedad, s.clase, s.tipo_vehiculo AS "tipoVehiculo",
              to_char(s.ocurrido_en, 'YYYY-MM-DD"T"HH24:MI') AS "ocurridoEn", ${SIN_LOCALIDAD} AS localidad
       FROM ${SINIESTROS.tabla} WHERE ${donde} ORDER BY s.ocurrido_en, s.id`,
      valores,
    );
  }

  contarSiniestrosPorLugarYHora(filtros: FiltrosTablero): Promise<ConteoLugarHora[]> {
    const { donde, valores } = armarCondiciones(SINIESTROS, filtros);
    return this.consultar(
      `SELECT l.nombre AS lugar, ${SIN_LOCALIDAD} AS localidad, extract(hour FROM s.ocurrido_en)::int AS hora, count(*)::int AS total
       FROM ${SINIESTROS.tabla} WHERE ${donde} GROUP BY 1, 2, 3`,
      valores,
    );
  }

  contarSiniestrosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]> {
    const { donde, valores } = armarCondiciones(SINIESTROS, filtros);
    return this.consultar(
      `SELECT to_char(s.ocurrido_en, 'YYYY-MM') AS mes, count(*)::int AS total
       FROM ${SINIESTROS.tabla} WHERE ${donde} GROUP BY 1 ORDER BY 1`,
      valores,
    );
  }

  contarVictimasPorSexoYEdad(filtros: FiltrosTablero): Promise<ConteoSexoEdad[]> {
    // Las victimas son las personas heridas o muertas y se cuentan solo las que tienen sexo y edad en el anuario
    const victimas = {
      ...SINIESTROS,
      tabla: `${SINIESTROS.tabla} JOIN dashboard.actores_viales v ON v.siniestro_id = s.id`,
      condicion: `v.gravedad IN ('herido', 'muerto') AND v.sexo IS NOT NULL AND v.edad IS NOT NULL`,
    };
    const { donde, valores } = armarCondiciones(victimas, filtros);
    return this.consultar(
      `SELECT v.sexo, v.edad, count(*)::int AS total FROM ${victimas.tabla} WHERE ${donde} GROUP BY 1, 2`,
      valores,
    );
  }

  contarUsuariosPorTipo(filtros: FiltrosTablero): Promise<ConteoPorTipo[]> {
    const { donde, valores } = armarCondiciones(USUARIOS, filtros);
    return this.consultar(
      `SELECT c.tipo_vehiculo AS "tipoVehiculo", sum(c.cantidad)::int AS total
       FROM ${USUARIOS.tabla} WHERE ${donde} GROUP BY 1`,
      valores,
    );
  }

  contarActivacionesPorLugar(filtros: FiltrosTablero): Promise<ConteoPorLugar[]> {
    const { donde, valores } = armarCondiciones(PANICO, filtros);
    return this.consultar(
      `SELECT l.nombre AS lugar, ${SIN_LOCALIDAD} AS localidad, l.latitud, l.longitud, count(*)::int AS total
       FROM ${PANICO.tabla} WHERE ${donde} GROUP BY l.id, lo.id`,
      valores,
    );
  }

  listarReportes(filtros: FiltrosTablero): Promise<ReporteDetallado[]> {
    const { donde, valores } = armarCondiciones(REPORTES, filtros);
    return this.consultar(
      `SELECT r.id, r.latitud, r.longitud, r.categoria, ${SIN_LOCALIDAD} AS localidad, r.tipo_vehiculo AS "tipoVehiculo",
              to_char(r.creado_en, 'YYYY-MM') AS mes
       FROM ${REPORTES.tabla} WHERE ${donde} ORDER BY r.creado_en`,
      valores,
    );
  }

  contarFalsosPositivosPorMotivo(filtros: FiltrosTablero): Promise<ConteoPorMotivo[]> {
    const { donde, valores } = armarCondiciones(FALSOS_POSITIVOS, filtros);
    return this.consultar(
      `SELECT r.motivo_falso_positivo AS motivo, count(*)::int AS total
       FROM ${FALSOS_POSITIVOS.tabla} WHERE ${donde} GROUP BY 1 ORDER BY 2 DESC`,
      valores,
    );
  }

  contarFalsosPositivosPorMes(filtros: FiltrosTablero): Promise<ConteoMensual[]> {
    const { donde, valores } = armarCondiciones(FALSOS_POSITIVOS, filtros);
    return this.consultar(
      `SELECT to_char(r.creado_en, 'YYYY-MM') AS mes, count(*)::int AS total
       FROM ${FALSOS_POSITIVOS.tabla} WHERE ${donde} GROUP BY 1 ORDER BY 1`,
      valores,
    );
  }

  private async consultar<T>(sql: string, valores: unknown[]): Promise<T[]> {
    const resultado = await this.pool.query(sql, valores);
    return resultado.rows;
  }
}
