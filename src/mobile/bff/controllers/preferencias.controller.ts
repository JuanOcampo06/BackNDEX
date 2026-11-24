import { Body, Controller, Get, Patch, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, UsuarioActual } from '../../../platform/auth';
import { ActualizarPreferenciasUseCase, ObtenerPreferenciasUseCase, Preferencias } from '../../modules/preferencias';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActualizarPreferenciasRequest } from '../dto/actualizar-preferencias.request';
import { PreferenciasResponse } from '../dto/preferencias.response';

// Preferencias de la app guardadas en la cuenta del ciudadano para que se vean igual en cualquier celular
// cuelga de /api/mobile/v1/me/preferencias, pide token y cada ciudadano solo ve y cambia las suyas
@ApiTags('App movil - Preferencias')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('me/preferencias')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class PreferenciasController {
  constructor(
    private readonly obtenerPreferencias: ObtenerPreferenciasUseCase,
    private readonly actualizarPreferencias: ActualizarPreferenciasUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Preferencias del ciudadano; si nunca guardo nada llegan los valores por defecto de la app' })
  @ApiOkResponse({ type: PreferenciasResponse })
  obtener(@UsuarioActual() usuarioId: number): Promise<Preferencias> {
    return this.obtenerPreferencias.execute(usuarioId);
  }

  @Patch()
  @ApiOperation({ summary: 'Cambiar solo las preferencias que se mandan; responde todas como quedaron' })
  @ApiOkResponse({ type: PreferenciasResponse })
  @ApiBadRequestResponse({ description: 'Un campo que no existe o un valor que no es una de las opciones' })
  @ApiNotFoundResponse({ description: 'El ciudadano del token ya no existe (USUARIO_NO_ENCONTRADO)' })
  actualizar(
    @UsuarioActual() usuarioId: number,
    // Convierte el cuerpo a su tipo y rechaza los campos que no existen
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) cambios: ActualizarPreferenciasRequest,
  ): Promise<Preferencias> {
    return this.actualizarPreferencias.execute(usuarioId, cambios);
  }
}
