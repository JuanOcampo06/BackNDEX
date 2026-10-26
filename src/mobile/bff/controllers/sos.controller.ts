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
import { ApiBadRequestResponse, ApiCreatedResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ActivacionSos, ActivarSosUseCase, CancelarSosUseCase, ListarSosUseCase } from '../../modules/sos';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActivacionSosResponse } from '../dto/activacion-sos.response';
import { ActivarSosRequest } from '../dto/activar-sos.request';
import { ListarSosQuery } from '../dto/listar-sos.query';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Boton de panico de la app movil
// todos cuelgan de /api/mobile/v1/sos y responden en camelCase
@ApiTags('App movil - Boton de panico')
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
  @ApiOperation({ summary: 'Activar el boton de panico' })
  @ApiCreatedResponse({ type: ActivacionSosResponse })
  @ApiBadRequestResponse({ description: 'Ubicacion invalida' })
  @ApiNotFoundResponse({ description: 'El ciudadano no existe' })
  activar(@Body(validar) cuerpo: ActivarSosRequest): Promise<ActivacionSos> {
    return this.activarSos.execute(cuerpo);
  }

  @Get()
  @ApiOperation({ summary: 'Listar activaciones (las mas recientes primero, maximo 100)' })
  @ApiOkResponse({ type: ActivacionSosResponse, isArray: true })
  listar(@Query(validar) consulta: ListarSosQuery): Promise<ActivacionSos[]> {
    return this.listarSos.execute(consulta);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una activacion que sigue activa' })
  @ApiOkResponse({ type: ActivacionSosResponse })
  @ApiNotFoundResponse({ description: 'No existe una activacion con ese id' })
  @ApiBadRequestResponse({ description: 'La activacion ya no esta activa' })
  cancelar(@Param('id', ParseIntPipe) id: number): Promise<ActivacionSos> {
    return this.cancelarSos.execute(id);
  }
}
