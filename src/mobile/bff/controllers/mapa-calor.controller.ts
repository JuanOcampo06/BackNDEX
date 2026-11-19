import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../platform/auth';
import { MapaDeCalor, ObtenerMapaCalorUseCase } from '../../modules/mapa-calor';
import { MapaCalorResponse } from '../dto/mapa-calor.response';

// Mapa de calor de la app con los siniestros del anuario y los reportes de los ultimos 90 dias
// cuelga de /api/mobile/v1/mapa-calor, pide token y responde en camelCase: la app solo tiene que dibujar las manchas
@ApiTags('App movil - Mapa de calor')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('mapa-calor')
@UseGuards(JwtAuthGuard)
export class MapaCalorController {
  constructor(private readonly obtenerMapaCalor: ObtenerMapaCalorUseCase) {}

  @Get()
  @ApiOperation({
    summary: 'Manchas del mapa de calor de toda la ciudad',
    description:
      'Junta los siniestros del anuario y los reportes de ciudadanos de los ultimos 90 dias en cuadros de unos 440 m. ' +
      'No trae siniestros ni reportes sueltos, solo donde se concentran.',
  })
  @ApiOkResponse({ type: MapaCalorResponse })
  obtener(): Promise<MapaDeCalor> {
    return this.obtenerMapaCalor.execute();
  }
}
