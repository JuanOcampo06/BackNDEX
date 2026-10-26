import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  ValidationPipe,
} from '@nestjs/common';
import { ActivacionSos, ActivarSosUseCase, CancelarSosUseCase, ListarSosUseCase } from '../../modules/sos';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActivarSosRequest } from '../dto/activar-sos.request';
import { ListarSosQuery } from '../dto/listar-sos.query';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Boton de panico de la app movil
// todos cuelgan de /api/mobile/v1/sos y responden en camelCase
@Controller('sos')
@UseFilters(DomainErrorFilter)
export class SosController {
  constructor(
    private readonly activarSos: ActivarSosUseCase,
    private readonly listarSos: ListarSosUseCase,
    private readonly cancelarSos: CancelarSosUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  activar(@Body(validar) cuerpo: ActivarSosRequest): Promise<ActivacionSos> {
    return this.activarSos.execute(cuerpo);
  }

  @Get()
  listar(@Query(validar) consulta: ListarSosQuery): Promise<ActivacionSos[]> {
    return this.listarSos.execute(consulta);
  }

  @Patch(':id/cancelar')
  cancelar(@Param('id', ParseIntPipe) id: number): Promise<ActivacionSos> {
    return this.cancelarSos.execute(id);
  }
}
