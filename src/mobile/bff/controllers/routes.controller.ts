import { Controller, Get, Query, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../platform/auth';
import { CalcularRutasUseCase, RecalcularRutaUseCase, ResultadoRutas, RutaRecalculada } from '../../modules/routes';
import { DomainErrorFilter } from '../domain-error.filter';
import { CalcularRutasQuery } from '../dto/calcular-rutas.query';
import { RecalcularRutaQuery } from '../dto/recalcular-ruta.query';
import { RutaRecalculadaResponse, RutasResponse } from '../dto/rutas.response';

// Rutas de la app movil: la segura, la equilibrada y la rapida entre dos puntos
// y recalcular la ruta cuando el ciudadano se sale de ella
// cuelga de /api/mobile/v1/routes, pide token y responde en camelCase
@ApiTags('App movil - Rutas')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('routes')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class RoutesController {
  constructor(
    private readonly calcularRutas: CalcularRutasUseCase,
    private readonly recalcularRuta: RecalcularRutaUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Calcular la ruta segura, la equilibrada y la rapida entre un origen y un destino' })
  @ApiOkResponse({ type: RutasResponse })
  @ApiBadRequestResponse({
    description:
      'Ubicacion invalida (RUTA_INVALIDA). Sin la llave de Google tambien responde origen o destino a mas de 600 metros de una ciclovia (RUTA_FUERA_DE_COBERTURA) o sin conexion entre las dos (RUTA_SIN_CAMINO): con ella esos casos van directo por las calles',
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

  @Get('recalcular')
  @ApiOperation({
    summary: 'Recalcular la ruta desde donde esta el ciudadano cuando se sale de la ruta',
    description:
      'La app lo llama cuando el ciudadano se aleja de la linea de la ruta. Devuelve una sola ruta, del mismo tipo que venia siguiendo, desde su ubicacion actual hasta el mismo destino',
  })
  @ApiOkResponse({ type: RutaRecalculadaResponse })
  @ApiBadRequestResponse({
    description: 'Ubicacion invalida o el ciudadano ya esta a menos de 30 metros del destino (RUTA_INVALIDA), o tipo que no existe',
  })
  recalcular(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) consulta: RecalcularRutaQuery,
  ): Promise<RutaRecalculada> {
    return this.recalcularRuta.execute({
      actual: { latitud: consulta.actualLat, longitud: consulta.actualLon },
      destino: { latitud: consulta.destinoLat, longitud: consulta.destinoLon },
      tipo: consulta.tipo,
    });
  }
}
