import { Controller, Get, Query, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../platform/auth';
import { CalcularRutasUseCase, ResultadoRutas } from '../../modules/routes';
import { DomainErrorFilter } from '../domain-error.filter';
import { CalcularRutasQuery } from '../dto/calcular-rutas.query';
import { RutasResponse } from '../dto/rutas.response';

// Rutas de la app movil: la segura, la equilibrada y la rapida entre dos puntos
// cuelga de /api/mobile/v1/routes, pide token y responde en camelCase
@ApiTags('App movil - Rutas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('routes')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class RoutesController {
  constructor(private readonly calcularRutas: CalcularRutasUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Calcular la ruta segura, la equilibrada y la rapida entre un origen y un destino' })
  @ApiOkResponse({ type: RutasResponse })
  @ApiBadRequestResponse({
    description:
      'Ubicacion invalida (RUTA_INVALIDA), origen o destino a mas de 600 metros de una ciclovia (RUTA_FUERA_DE_COBERTURA) o sin conexion entre las dos (RUTA_SIN_CAMINO)',
  })
  calcular(
    // Convierte los parametros de la url a su tipo y rechaza los que no existen
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) consulta: CalcularRutasQuery,
  ): Promise<ResultadoRutas> {
    return this.calcularRutas.execute({
      origen: { latitud: consulta.origenLat, longitud: consulta.origenLon },
      destino: { latitud: consulta.destinoLat, longitud: consulta.destinoLon },
    });
  }
}
