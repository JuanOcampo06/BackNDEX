import { BadRequestException, Controller, Get, Query, ValidationPipe } from '@nestjs/common';
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
  ObtenerUsuariosPorTipoUseCase,
  Periodo,
} from '../../modules/kpis';
import { TableroQuery } from '../dto/tablero.query';
import { aSnakeCase } from '../snake-case';

// Convierte localidad_id a numero y rechaza parametros que no existen
const validarFiltros = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Endpoints de solo lectura para cada tarjeta y grafica del tablero
// todos cuelgan de /api/dashboard/v1/tablero y responden en snake_case
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
  ) {}

  // Opciones de los selectores Localidad Vehiculo y Fuente
  @Get('filtros')
  async filtros(): Promise<unknown> {
    return aSnakeCase(await this.obtenerFiltros.execute());
  }

  // Tarjetas de la parte de arriba
  @Get('tarjetas/siniestros')
  tarjetaSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('siniestros', consulta);
  }

  @Get('tarjetas/usuarios')
  tarjetaUsuarios(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('usuarios', consulta);
  }

  @Get('tarjetas/reportes')
  tarjetaReportes(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('reportes', consulta);
  }

  @Get('tarjetas/boton-panico')
  tarjetaBotonPanico(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('boton_panico', consulta);
  }

  @Get('tarjetas/falsos-positivos')
  tarjetaFalsosPositivos(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return this.tarjeta('falsos_positivos', consulta);
  }

  // Graficas del tablero
  @Get('mapa-siniestros')
  async mapaSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerMapaSiniestros.execute(aFiltros(consulta)));
  }

  @Get('lugares-con-mas-siniestros')
  async lugaresConMasSiniestros(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerLugaresConMasSiniestros.execute(aFiltros(consulta)));
  }

  @Get('siniestros-por-hora')
  async siniestrosPorHora(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerSiniestrosPorHora.execute(aFiltros(consulta)));
  }

  @Get('tendencia-mensual')
  async tendenciaMensual(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerTendenciaMensual.execute(aFiltros(consulta)));
  }

  @Get('siniestros-por-sexo-y-edad')
  async siniestrosPorSexoYEdad(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerSiniestrosPorSexoYEdad.execute(aFiltros(consulta)));
  }

  @Get('usuarios-por-tipo')
  async usuariosPorTipo(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerUsuariosPorTipo.execute(aFiltros(consulta)));
  }

  @Get('boton-panico')
  async botonPanico(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerBotonPanico.execute(aFiltros(consulta)));
  }

  @Get('reportes')
  async reportes(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerReportes.execute(aFiltros(consulta)));
  }

  @Get('falsos-positivos')
  async falsosPositivos(@Query(validarFiltros) consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerFalsosPositivos.execute(aFiltros(consulta)));
  }

  private async tarjeta(indicador: Indicador, consulta: TableroQuery): Promise<unknown> {
    return aSnakeCase(await this.obtenerTarjeta.execute(indicador, aFiltros(consulta)));
  }
}

// Pasa los filtros de la url al formato del negocio y responde 400 si el rango de meses no tiene sentido
function aFiltros(consulta: TableroQuery): FiltrosTablero {
  try {
    return {
      periodo: Periodo.desdeFiltro(new Date(), consulta.mes_desde, consulta.mes_hasta),
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
