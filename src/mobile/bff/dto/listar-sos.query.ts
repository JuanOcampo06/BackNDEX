import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ESTADOS_SOS } from '../../modules/sos';
import type { EstadoSos } from '../../modules/sos';

// Filtros opcionales del GET /sos en la url y siempre se listan solo las activaciones del ciudadano del token
export class ListarSosQuery {
  @ApiPropertyOptional({ enum: ESTADOS_SOS })
  @IsOptional()
  @IsIn(ESTADOS_SOS)
  estado?: EstadoSos;
}
