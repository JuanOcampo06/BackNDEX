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
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, UsuarioActual } from '../../../platform/auth';
import { CrearReporteUseCase, ListarReportesUseCase, ObtenerReporteUseCase, Reporte } from '../../modules/reports';
import { DomainErrorFilter } from '../domain-error.filter';
import { CrearReporteRequest } from '../dto/crear-reporte.request';
import { ListarReportesQuery } from '../dto/listar-reportes.query';
import { ReporteResponse } from '../dto/reporte.response';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Reportes ciudadanos de la app movil
// todos cuelgan de /api/mobile/v1/reports, responden en camelCase y piden token
// el ciudadano sale del token y cada uno ve solo sus reportes
@ApiTags('App movil - Reportes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('reports')
@UseGuards(JwtAuthGuard)
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
  crear(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: CrearReporteRequest): Promise<Reporte> {
    return this.crearReporte.execute({ usuarioId, ...cuerpo });
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis reportes (los mas recientes primero, maximo 100)' })
  @ApiOkResponse({ type: ReporteResponse, isArray: true })
  listar(@UsuarioActual() usuarioId: number, @Query(validar) consulta: ListarReportesQuery): Promise<Reporte[]> {
    return this.listarReportes.execute({ ...consulta, usuarioId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver uno de mis reportes por su id' })
  @ApiOkResponse({ type: ReporteResponse })
  @ApiNotFoundResponse({ description: 'No existe un reporte mio con ese id' })
  obtener(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<Reporte> {
    return this.obtenerReporte.execute(id, usuarioId);
  }
}
