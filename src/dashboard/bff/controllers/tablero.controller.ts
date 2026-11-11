import { BadRequestException, Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../../platform/auth';
import {
  DomainError,
  FiltrosTablero,
  Indicador,
  ObtenerBotonPanicoUseCase,
  ObtenerFalsosPositivosUseCase,
  ObtenerFiltrosUseCase,
  ObtenerLugaresConMasSiniestrosUseCase,
  ObtenerMapaSiniestrosUseCase,
  ObtenerReportesUseCase,
  ObtenerSiniestrosPorHoraUseCase,
  ObtenerSiniestrosPorSexoYEdadUseCase,
  ObtenerTarjetaUseCase,
  ObtenerTendenciaMensualUseCase,
  ObtenerUltimoMesConDatosUseCase,
  ObtenerUsuariosPorTipoUseCase,
  Periodo,
} from '../../modules/kpis';
import { TableroQuery } from '../dto/tablero.query';
import { aSnakeCase } from '../snake-case';

// Convierte localidad_id a numero y rechaza parametros que no existen
const validarFiltros = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Endpoints de solo lectura para cada tarjeta y grafica del tablero
// todos cuelgan de /api/dashboard/v1/tablero y responden en snake_case
@ApiTags('Dashboard - Tablero')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
@UseGuards(DashboardAuthGuard)
@ApiBadRequestResponse({ description: 'Algun filtro tiene formato invalido o el rango de meses esta al reves' })
@Controller('tablero')
export class TableroController {
  constructor(
    private readonly obtenerFiltros: ObtenerFiltrosUseCase,
    private readonly obtenerTarjeta: ObtenerTarjetaUseCase,
    private readonly obtenerMapaSiniestros: ObtenerMapaSiniestrosUseCase,
    private readonly obtenerLugaresConMasSiniestros: ObtenerLugaresConMasSiniestrosUseCase,
    private readonly obtenerSiniestrosPorHora: ObtenerSiniestrosPorHoraUseCase,
    private readonly obtenerTendenciaMensual: ObtenerTendenciaMensualUseCase,
    private readonly obtenerSiniestrosPorSexoYEdad: ObtenerSiniestrosPorSexoYEdadUseCase,
    private readonly obtenerUsuariosPorTipo: ObtenerUsuariosPorTipoUseCase,
    private readonly obtenerBotonPanico: ObtenerBotonPanicoUseCase,
    private readonly obtenerReportes: ObtenerReportesUseCase,
    private readonly obtenerFalsosPositivos: ObtenerFalsosPositivosUseCase,
    private readonly obtenerUltimoMesConDatos: ObtenerUltimoMesConDatosUseCase,
  ) {}

  // Opciones de los selectores Localidad Vehiculo y Fuente
  @Get('filtros')
  @ApiOperation({ summary: 'Opciones de los filtros Localidad Vehiculo y Fuente' })
  @ApiOkResponse({ description: 'Responde localidades tipos_vehiculo y fuentes' })
  async filtros(): Promise<unknown> {
    return aSnakeCase(await this.obtenerFiltros.execute());
  }

  // Tarjetas de la parte de arriba
  @Get('tarjetas/siniestros')
  @ApiOperation({ summary: 'Tarjeta Siniestros' })
  @ApiOkResponse({ description: 'Responde valor valor_periodo_anterior variacion_porcentual y serie_semanal' })
  tarjetaSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('siniestros', consulta);
  }

  @Get('tarjetas/usuarios')
  @ApiOperation({ summary: 'Tarjeta Usuarios de micromovilidad' })
  @ApiOkResponse({ description: 'Responde valor valor_periodo_anterior variacion_porcentual y serie_semanal' })
  tarjetaUsuarios(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('usuarios', consulta);
  }

  @Get('tarjetas/reportes')
  @ApiOperation({ summary: 'Tarjeta Reportes' })
  @ApiOkResponse({ description: 'Responde valor valor_periodo_anterior variacion_porcentual y serie_semanal' })
  tarjetaReportes(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('reportes', consulta);
  }

  @Get('tarjetas/boton-panico')
  @ApiOperation({ summary: 'Tarjeta Boton de panico' })
  @ApiOkResponse({ description: 'Responde valor valor_periodo_anterior variacion_porcentual y serie_semanal' })
  tarjetaBotonPanico(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('boton_panico', consulta);
  }

  @Get('tarjetas/falsos-positivos')
  @ApiOperation({ summary: 'Tarjeta Falsos positivos' })
  @ApiOkResponse({ description: 'Responde lo mismo que las demas tarjetas mas porcentaje_de_reportes' })
  tarjetaFalsosPositivos(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('falsos_positivos', consulta);
  }

  // Graficas del tablero
  @Get('mapa-siniestros')
  @ApiOperation({ summary: 'Puntos del mapa de siniestros' })
  @ApiOkResponse({ description: 'Responde siniestros con coordenadas gravedad clase tipo_vehiculo y ocurrido_en' })
  async mapaSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerMapaSiniestros.execute(await this.aFiltros(consulta)));
  }

  @Get('lugares-con-mas-siniestros')
  @ApiOperation({ summary: 'Los cinco lugares con mas siniestros' })
  @ApiOkResponse({ description: 'Responde posicion lugar localidad franja_pico y total' })
  async lugaresConMasSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerLugaresConMasSiniestros.execute(await this.aFiltros(consulta)));
  }

  @Get('siniestros-por-hora')
  @ApiOperation({ summary: 'Siniestros por hora del dia' })
  @ApiOkResponse({ description: 'Responde 24 barras con hora franja y total' })
  async siniestrosPorHora(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerSiniestrosPorHora.execute(await this.aFiltros(consulta)));
  }

  @Get('tendencia-mensual')
  @ApiOperation({ summary: 'Tendencia mensual del anio actual contra el anterior' })
  @ApiOkResponse({ description: 'Responde anio_actual anio_anterior meses_filtrados y 12 meses' })
  async tendenciaMensual(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerTendenciaMensual.execute(await this.aFiltros(consulta)));
  }

  @Get('siniestros-por-sexo-y-edad')
  @ApiOperation({ summary: 'Siniestros por sexo y rango de edad' })
  @ApiOkResponse({ description: 'Responde total_mujer total_hombre y rangos' })
  async siniestrosPorSexoYEdad(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerSiniestrosPorSexoYEdad.execute(await this.aFiltros(consulta)));
  }

  @Get('usuarios-por-tipo')
  @ApiOperation({ summary: 'Usuarios de micromovilidad por tipo de vehiculo' })
  @ApiOkResponse({ description: 'Responde total y tipos de los usuarios que cuenta la app movil' })
  async usuariosPorTipo(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerUsuariosPorTipo.execute(await this.aFiltros(consulta)));
  }

  @Get('boton-panico')
  @ApiOperation({ summary: 'Mapa y top de ubicaciones del boton de panico' })
  @ApiOkResponse({ description: 'Responde total lugares y top_ubicaciones' })
  async botonPanico(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerBotonPanico.execute(await this.aFiltros(consulta)));
  }

  @Get('reportes')
  @ApiOperation({ summary: 'Mapa y categorias de los reportes' })
  @ApiOkResponse({ description: 'Responde total puntos y por_categoria' })
  async reportes(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerReportes.execute(await this.aFiltros(consulta)));
  }

  @Get('falsos-positivos')
  @ApiOperation({ summary: 'Motivos y evolucion de los falsos positivos' })
  @ApiOkResponse({ description: 'Responde total porcentaje_de_reportes por_motivo y evolucion_mensual' })
  async falsosPositivos(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerFalsosPositivos.execute(await this.aFiltros(consulta)));
  }

  // Sin meses el periodo termina en el ultimo mes con datos de las fuentes elegidas para que el tablero no abra vacio
  private async aFiltros(consulta: TableroQuery): Promise<FiltrosTablero> {
    const sinMeses = consulta.mes_desde === undefined && consulta.mes_hasta === undefined;
    const mesHasta = sinMeses ? await this.obtenerUltimoMesConDatos.execute(consulta.fuente) : consulta.mes_hasta;
    return armarFiltros(consulta, mesHasta);
  }

  private async tarjeta(indicador: Indicador, consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerTarjeta.execute(indicador, await this.aFiltros(consulta)));
  }
}

// Pasa los filtros de la url al formato del negocio y responde 400 si el rango de meses no tiene sentido
function armarFiltros(consulta: TableroQuery, mesHasta: string | undefined): FiltrosTablero {
  try {
    return {
      periodo: Periodo.desdeFiltro(new Date(), consulta.mes_desde, mesHasta),
      localidadId: consulta.localidad_id,
      tipoVehiculo: consulta.tipo_vehiculo,
      fuente: consulta.fuente,
    };
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ codigo: error.codigo, mensaje: error.message });
    }
    throw error;
  }
}
