import { Controller, Get, Query, StreamableFile, UseFilters, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ExportarKpisUseCase, Periodo } from '../../modules/kpis';
import { DomainErrorFilter } from '../domain-error.filter';
import { ExportarKpisQuery } from '../dto/exportar-kpis.query';

const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Exportacion a Excel del boton Exportar del tablero en /api/dashboard/v1/tablero/exportar
// responde el archivo xlsx y los errores en snake_case como el resto del dashboard
@ApiTags('Dashboard - Tablero')
@Controller('tablero/exportar')
@UseFilters(DomainErrorFilter)
export class ExportarKpisController {
  constructor(private readonly exportarKpis: ExportarKpisUseCase) {}

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
    const archivo = await this.exportarKpis.execute({
      kpis: consulta.kpis,
      filtros: {
        periodo: Periodo.desdeFiltro(new Date(), consulta.mes_desde, consulta.mes_hasta),
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
