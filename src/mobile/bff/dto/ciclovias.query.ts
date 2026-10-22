import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { TIPOS_CICLOVIA } from '../../../common/modules/ciclovias';
import type { TipoCiclovia } from '../../../common/modules/ciclovias';

// Esquinas de la parte del mapa que se ve en la app movil en camelCase
// llegan como texto en la url y se convierten a numero
export class CicloviasQuery {
  @Type(() => Number)
  @IsNumber()
  minLat!: number;

  @Type(() => Number)
  @IsNumber()
  minLon!: number;

  @Type(() => Number)
  @IsNumber()
  maxLat!: number;

  @Type(() => Number)
  @IsNumber()
  maxLon!: number;

  // Sin tipo llegan ciclovias y cruces juntos
  @IsOptional()
  @IsIn(TIPOS_CICLOVIA)
  tipo?: TipoCiclovia;
}
