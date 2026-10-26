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
import { CrearReporteUseCase, ListarReportesUseCase, ObtenerReporteUseCase, Reporte } from '../../modules/reports';
import { DomainErrorFilter } from '../domain-error.filter';
import { CrearReporteRequest } from '../dto/crear-reporte.request';
import { ListarReportesQuery } from '../dto/listar-reportes.query';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Reportes ciudadanos de la app movil
// todos cuelgan de /api/mobile/v1/reports y responden en camelCase
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
  crear(@Body(validar) cuerpo: CrearReporteRequest): Promise<Reporte> {
    return this.crearReporte.execute(cuerpo);
  }

  @Get()
  listar(@Query(validar) consulta: ListarReportesQuery): Promise<Reporte[]> {
    return this.listarReportes.execute(consulta);
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number): Promise<Reporte> {
    return this.obtenerReporte.execute(id);
  }
}
