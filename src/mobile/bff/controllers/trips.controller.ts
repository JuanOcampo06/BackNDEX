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
  UseFilters,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, UsuarioActual } from '../../../platform/auth';
import {
  FinalizarViajeUseCase,
  IniciarViajeUseCase,
  ListarViajesUseCase,
  ObtenerViajeUseCase,
  PuntoViaje,
  RegistrarPuntoUseCase,
  Viaje,
  ViajeConPuntos,
} from '../../modules/trips';
import { DomainErrorFilter } from '../domain-error.filter';
import { UbicacionRequest } from '../dto/ubicacion.request';
import { PuntoViajeResponse, ViajeDetalleResponse, ViajeResponse } from '../dto/viaje.response';

// Convierte el cuerpo a su tipo y rechaza los campos que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Viajes en bicicleta de la app movil
// todos cuelgan de /api/mobile/v1/trips, piden token y cada ciudadano ve solo los suyos
@ApiTags('App movil - Viajes')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('trips')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class TripsController {
  constructor(
    private readonly iniciarViaje: IniciarViajeUseCase,
    private readonly registrarPunto: RegistrarPuntoUseCase,
    private readonly finalizarViaje: FinalizarViajeUseCase,
    private readonly listarViajes: ListarViajesUseCase,
    private readonly obtenerViaje: ObtenerViajeUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Iniciar un viaje desde la ubicacion actual' })
  @ApiCreatedResponse({ type: ViajeResponse })
  @ApiBadRequestResponse({ description: 'Ubicacion invalida' })
  @ApiConflictResponse({ description: 'Ya tienes un viaje en curso' })
  iniciar(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: UbicacionRequest): Promise<Viaje> {
    return this.iniciarViaje.execute({ usuarioId, ...cuerpo });
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis viajes (los mas recientes primero, maximo 100)' })
  @ApiOkResponse({ type: ViajeResponse, isArray: true })
  listar(@UsuarioActual() usuarioId: number): Promise<Viaje[]> {
    return this.listarViajes.execute(usuarioId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver uno de mis viajes con todo su recorrido' })
  @ApiOkResponse({ type: ViajeDetalleResponse })
  @ApiNotFoundResponse({ description: 'No existe un viaje mio con ese id' })
  obtener(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<ViajeConPuntos> {
    return this.obtenerViaje.execute(usuarioId, id);
  }

  @Post(':id/puntos')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Agregar un punto GPS al recorrido de un viaje en curso' })
  @ApiCreatedResponse({ type: PuntoViajeResponse })
  @ApiBadRequestResponse({ description: 'Ubicacion invalida o el viaje ya termino' })
  @ApiNotFoundResponse({ description: 'No existe un viaje mio con ese id' })
  agregarPunto(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(validar) cuerpo: UbicacionRequest,
  ): Promise<PuntoViaje> {
    return this.registrarPunto.execute(usuarioId, id, cuerpo);
  }

  @Patch(':id/finalizar')
  @ApiOperation({ summary: 'Finalizar un viaje en curso y calcular los metros recorridos' })
  @ApiOkResponse({ type: ViajeResponse })
  @ApiBadRequestResponse({ description: 'El viaje ya termino' })
  @ApiNotFoundResponse({ description: 'No existe un viaje mio con ese id' })
  finalizar(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<Viaje> {
    return this.finalizarViaje.execute(usuarioId, id);
  }
}
