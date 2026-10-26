import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ESTADOS_SOS } from '../../modules/sos';
import type { EstadoSos } from '../../modules/sos';

// Filtros opcionales del GET /sos en la url
export class ListarSosQuery {
  // Llega como texto en la url y se convierte a numero
  @ApiPropertyOptional({ example: 1, description: 'Solo las activaciones de este ciudadano' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @ApiPropertyOptional({ enum: ESTADOS_SOS })
  @IsOptional()
  @IsIn(ESTADOS_SOS)
  estado?: EstadoSos;
}
