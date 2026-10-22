import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { TIPOS_CICLOVIA } from '../../../common/modules/ciclovias';
import type { TipoCiclovia } from '../../../common/modules/ciclovias';

// Esquinas de la parte del mapa que se ve en el dashboard
// llegan como texto en la url y se convierten a numero
export class CicloviasQuery {
  @Type(() => Number)
  @IsNumber()
  min_lat!: number;

  @Type(() => Number)
  @IsNumber()
  min_lon!: number;

  @Type(() => Number)
  @IsNumber()
  max_lat!: number;

  @Type(() => Number)
  @IsNumber()
  max_lon!: number;

  // Sin tipo llegan ciclovias y cruces juntos
  @IsOptional()
  @IsIn(TIPOS_CICLOVIA)
  tipo?: TipoCiclovia;
}
