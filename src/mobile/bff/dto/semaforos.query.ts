import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber } from 'class-validator';

// Esquinas de la parte del mapa que se ve en la app movil en camelCase
// llegan como texto en la url y se convierten a numero
export class SemaforosQuery {
  @ApiProperty({ example: 4.66, description: 'Latitud del borde sur del mapa visible' })
  @Type(() => Number)
  @IsNumber()
  minLat!: number;

  @ApiProperty({ example: -74.07, description: 'Longitud del borde oeste' })
  @Type(() => Number)
  @IsNumber()
  minLon!: number;

  @ApiProperty({ example: 4.68, description: 'Latitud del borde norte' })
  @Type(() => Number)
  @IsNumber()
  maxLat!: number;

  @ApiProperty({ example: -74.04, description: 'Longitud del borde este' })
  @Type(() => Number)
  @IsNumber()
  maxLon!: number;
}
