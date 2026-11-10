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
import { ActivacionSos, ActivarSosUseCase, CancelarSosUseCase, ListarSosUseCase } from '../../modules/sos';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActivacionSosResponse } from '../dto/activacion-sos.response';
import { ActivarSosRequest } from '../dto/activar-sos.request';
import { ListarSosQuery } from '../dto/listar-sos.query';

// Convierte los parametros de la url a su tipo y rechaza los que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Boton de panico de la app movil
// todos cuelgan de /api/mobile/v1/sos, responden en camelCase y piden token
// el ciudadano sale del token y cada uno ve y cancela solo sus activaciones
@ApiTags('App movil - Boton de panico')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('sos')
@UseGuards(JwtAuthGuard)
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
  activar(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: ActivarSosRequest): Promise<ActivacionSos> {
    return this.activarSos.execute({ usuarioId, ...cuerpo });
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis activaciones (las mas recientes primero, maximo 100)' })
  @ApiOkResponse({ type: ActivacionSosResponse, isArray: true })
  listar(@UsuarioActual() usuarioId: number, @Query(validar) consulta: ListarSosQuery): Promise<ActivacionSos[]> {
    return this.listarSos.execute({ ...consulta, usuarioId });
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar una de mis activaciones que sigue activa' })
  @ApiOkResponse({ type: ActivacionSosResponse })
  @ApiNotFoundResponse({ description: 'No existe una activacion mia con ese id' })
  @ApiBadRequestResponse({ description: 'La activacion ya no esta activa' })
  cancelar(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<ActivacionSos> {
    return this.cancelarSos.execute(id, usuarioId);
  }
}
