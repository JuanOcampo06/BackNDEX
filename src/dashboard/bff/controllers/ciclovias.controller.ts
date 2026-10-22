import { BadRequestException, Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { AreaMapa, DomainError, ObtenerCicloviasUseCase } from '../../../common/modules/ciclovias';
import { CicloviasQuery } from '../dto/ciclovias.query';
import { aSnakeCase } from '../snake-case';

// Ciclovias de la zona del mapa del dashboard en /api/dashboard/v1/ciclovias
// usa el mismo caso de uso que la app movil pero responde en snake_case
@Controller('ciclovias')
export class CicloviasController {
  constructor(private readonly obtenerCiclovias: ObtenerCicloviasUseCase) {}

  // El ValidationPipe convierte las esquinas a numero y rechaza parametros que no existen
  @Get()
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
