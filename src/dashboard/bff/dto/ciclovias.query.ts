import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional } from 'class-validator';
import { TIPOS_CICLOVIA } from '../../../common/modules/ciclovias';
import type { TipoCiclovia } from '../../../common/modules/ciclovias';

// Esquinas de la parte del mapa que se ve en el dashboard
// llegan como texto en la url y se convierten a numero
export class CicloviasQuery {
  @ApiProperty({ example: 4.66, description: 'Latitud del borde sur del mapa visible' })
  @Type(() => Number)
  @IsNumber()
  min_lat!: number;

  @ApiProperty({ example: -74.06, description: 'Longitud del borde oeste' })
  @Type(() => Number)
  @IsNumber()
  min_lon!: number;

  @ApiProperty({ example: 4.68, description: 'Latitud del borde norte' })
  @Type(() => Number)
  @IsNumber()
  max_lat!: number;

  @ApiProperty({ example: -74.04, description: 'Longitud del borde este' })
  @Type(() => Number)
  @IsNumber()
  max_lon!: number;

  // Sin tipo llegan ciclovias y cruces juntos
  @ApiPropertyOptional({ enum: TIPOS_CICLOVIA })
  @IsOptional()
  @IsIn(TIPOS_CICLOVIA)
  tipo?: TipoCiclovia;
}
