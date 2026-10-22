import { BadRequestException, Controller, Get, Query, ValidationPipe } from '@nestjs/common';
import { AreaMapa, CicloviasEnArea, DomainError, ObtenerCicloviasUseCase } from '../../../common/modules/ciclovias';
import { CicloviasQuery } from '../dto/ciclovias.query';

// Ciclovias de la zona del mapa de la app en /api/mobile/v1/ciclovias
// usa el mismo caso de uso que el dashboard y responde en camelCase tal como sale del negocio
@Controller('ciclovias')
export class CicloviasController {
  constructor(private readonly obtenerCiclovias: ObtenerCicloviasUseCase) {}

  // El ValidationPipe convierte las esquinas a numero y rechaza parametros que no existen
  @Get()
  listar(
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
    consulta: CicloviasQuery,
  ): Promise<CicloviasEnArea> {
    return this.obtenerCiclovias.execute({ area: aArea(consulta), tipo: consulta.tipo });
  }
}

// Arma el area del mapa y responde 400 si las esquinas no tienen sentido
function aArea(consulta: CicloviasQuery): AreaMapa {
  try {
    return new AreaMapa(consulta);
  } catch (error) {
    if (error instanceof DomainError) {
      throw new BadRequestException({ codigo: error.codigo, mensaje: error.message });
    }
    throw error;
  }
}
