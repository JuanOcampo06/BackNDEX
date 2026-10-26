import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrearReporteUseCase, ListarReportesUseCase, ObtenerReporteUseCase, Reporte } from '../../modules/reports';
import { DomainErrorFilter } from '../domain-error.filter';
import { CrearReporteRequest } from '../dto/crear-reporte.request';
import { ListarReportesQuery } from '../dto/listar-reportes.query';
import { ReporteResponse } from '../dto/reporte.response';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Reportes ciudadanos de la app movil
// todos cuelgan de /api/mobile/v1/reports y responden en camelCase
@ApiTags('App movil - Reportes')
@Controller('reports')
@UseFilters(DomainErrorFilter)
export class ReportsController {
  constructor(
    private readonly crearReporte: CrearReporteUseCase,
    private readonly listarReportes: ListarReportesUseCase,
    private readonly obtenerReporte: ObtenerReporteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un reporte ciudadano' })
  @ApiCreatedResponse({ type: ReporteResponse })
  @ApiBadRequestResponse({ description: 'Datos invalidos' })
  @ApiNotFoundResponse({ description: 'El ciudadano no existe' })
  crear(@Body(validar) cuerpo: CrearReporteRequest): Promise<Reporte> {
    return this.crearReporte.execute(cuerpo);
  }

  @Get()
  @ApiOperation({ summary: 'Listar reportes (los mas recientes primero, maximo 100)' })
  @ApiOkResponse({ type: ReporteResponse, isArray: true })
  listar(@Query(validar) consulta: ListarReportesQuery): Promise<Reporte[]> {
    return this.listarReportes.execute(consulta);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un reporte por su id' })
  @ApiOkResponse({ type: ReporteResponse })
  @ApiNotFoundResponse({ description: 'No existe un reporte con ese id' })
  obtener(@Param('id', ParseIntPipe) id: number): Promise<Reporte> {
    return this.obtenerReporte.execute(id);
  }
}
