import { Controller, Get, Query, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../platform/auth';
import { ObtenerSemaforosUseCase, SemaforosEnArea } from '../../modules/semaforos';
import { DomainErrorFilter } from '../domain-error.filter';
import { SemaforosQuery } from '../dto/semaforos.query';
import { SemaforosResponse } from '../dto/semaforos.response';

// Semaforos de las ciclorrutas de la zona del mapa de la app
// cuelga de /api/mobile/v1/semaforos, pide token y responde en camelCase: la app solo tiene que dibujarlos
@ApiTags('App movil - Semaforos')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('semaforos')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class SemaforosController {
  constructor(private readonly obtenerSemaforos: ObtenerSemaforosUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Semaforos de las ciclorrutas de la zona visible del mapa' })
  @ApiOkResponse({ type: SemaforosResponse })
  @ApiBadRequestResponse({ description: 'Faltan esquinas o minLat minLon maxLat maxLon no tienen sentido (AREA_INVALIDA)' })
  listar(
    // Convierte los parametros de la url a su tipo y rechaza los que no existen
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) consulta: SemaforosQuery,
  ): Promise<SemaforosEnArea> {
    return this.obtenerSemaforos.execute(consulta);
  }
}
