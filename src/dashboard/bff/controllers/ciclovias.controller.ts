import { BadRequestException, Controller, Get, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardAuthGuard } from '../../../platform/auth';
import { AreaMapa, DomainError, ObtenerCicloviasUseCase } from '../../../common/modules/ciclovias';
import { CicloviasQuery } from '../dto/ciclovias.query';
import { aSnakeCase } from '../snake-case';

// Ciclovias de la zona del mapa del dashboard en /api/dashboard/v1/ciclovias
// usa el mismo caso de uso que la app movil pero responde en snake_case
@ApiTags('Compartido - Ciclovias')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
@UseGuards(DashboardAuthGuard)
@Controller('ciclovias')
export class CicloviasController {
  constructor(private readonly obtenerCiclovias: ObtenerCicloviasUseCase) {}

  // El ValidationPipe convierte las esquinas a numero y rechaza parametros que no existen
  @Get()
  @ApiOperation({ summary: 'Ciclovias de la zona visible del mapa para el dashboard en snake_case' })
  @ApiOkResponse({ description: 'Responde total y ciclovias con id tipo nombre riesgo nodos y coordenadas' })
  @ApiBadRequestResponse({ description: 'Faltan esquinas o min_lat min_lon max_lat max_lon no tienen sentido' })
  async listar(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    consulta: CicloviasQuery,
  ): Promise<unknown> {
    const area = aArea(consulta);
    return aSnakeCase(await this.obtenerCiclovias.execute({ area, tipo: consulta.tipo }));
  }
}

// Arma el area del mapa y responde 400 si las esquinas no tienen sentido
function aArea(consulta: CicloviasQuery): AreaMapa {
  try {
    return new AreaMapa({
      minLat: consulta.min_lat,
      minLon: consulta.min_lon,
      maxLat: consulta.max_lat,
      maxLon: consulta.max_lon,
    });
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ codigo: error.codigo, mensaje: error.message });
    }
    throw error;
  }
}
