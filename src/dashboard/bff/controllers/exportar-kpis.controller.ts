import { Controller, Get, Query, StreamableFile, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardAuthGuard, SoloRoles } from '../../../platform/auth';
import { ExportarKpisUseCase, ObtenerUltimoMesConDatosUseCase, Periodo } from '../../modules/kpis';
import { ROL_ADMINISTRADOR } from '../../modules/users';
import { DomainErrorFilter } from '../domain-error.filter';
import { ExportarKpisQuery } from '../dto/exportar-kpis.query';

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Exportacion a Excel del boton Exportar del tablero en /api/dashboard/v1/tablero/exportar
// responde el archivo xlsx y los errores en snake_case como el resto del dashboard
@ApiTags('Dashboard - Tablero')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
@ApiForbiddenResponse({ description: 'El token es valido pero el rol no es Administrador' })
// Solo el Administrador puede exportar
@UseGuards(DashboardAuthGuard)
@SoloRoles(ROL_ADMINISTRADOR)
@Controller('tablero/exportar')
@UseFilters(DomainErrorFilter)
export class ExportarKpisController {
  constructor(
    private readonly exportarKpis: ExportarKpisUseCase,
    private readonly obtenerUltimoMesConDatos: ObtenerUltimoMesConDatosUseCase,
  ) {}

  // El ValidationPipe convierte los filtros a su tipo y rechaza parametros que no existen
  @Get()
  @ApiOperation({ summary: 'Exportar a Excel los KPIs que el usuario elija con los filtros del tablero' })
  @ApiProduces(TIPO_XLSX)
  @ApiOkResponse({
    description: 'Archivo xlsx con una hoja de filtros y una hoja por cada KPI elegido',
    content: { [TIPO_XLSX]: { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiBadRequestResponse({ description: 'No llego ningun KPI o alguno no existe o algun filtro es invalido' })
  async exportar(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    consulta: ExportarKpisQuery,
  ): Promise<StreamableFile> {
    // Sin meses se exporta lo mismo que muestra el tablero que termina en el ultimo mes con datos
    const sinMeses = consulta.mes_desde === undefined && consulta.mes_hasta === undefined;
    const mesHasta = sinMeses ? await this.obtenerUltimoMesConDatos.execute(consulta.fuente) : consulta.mes_hasta;
    const archivo = await this.exportarKpis.execute({
      kpis: consulta.kpis,
      filtros: {
        periodo: Periodo.desdeFiltro(new Date(), consulta.mes_desde, mesHasta),
        localidadId: consulta.localidad_id,
        tipoVehiculo: consulta.tipo_vehiculo,
        fuente: consulta.fuente,
      },
    });
    return new StreamableFile(archivo.contenido, {
      type: TIPO_XLSX,
      disposition: `attachment; filename="${archivo.nombre}"`,
      length: archivo.contenido.byteLength,
    });
  }
}
