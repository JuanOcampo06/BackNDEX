import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ESTADOS_SOS } from '../../modules/sos';
import type { EstadoSos } from '../../modules/sos';

// Filtros opcionales del GET /sos en la url
export class ListarSosQuery {
  // Llega como texto en la url y se convierte a numero
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @IsOptional()
  @IsIn(ESTADOS_SOS)
  estado?: EstadoSos;
}
