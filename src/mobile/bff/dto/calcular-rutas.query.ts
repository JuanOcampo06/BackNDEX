import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

// Parametros del GET /routes en la url: de donde sale el ciudadano y a donde va
// llegan como texto y se convierten a numero
export class CalcularRutasQuery {
  @ApiProperty({ example: 4.6486, minimum: -90, maximum: 90, description: 'Latitud del origen' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  origenLat!: number;

  @ApiProperty({ example: -74.0818, minimum: -180, maximum: 180, description: 'Longitud del origen' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  origenLon!: number;

  @ApiProperty({ example: 4.6702, minimum: -90, maximum: 90, description: 'Latitud del destino' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinoLat!: number;

  @ApiProperty({ example: -74.0623, minimum: -180, maximum: 180, description: 'Longitud del destino' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinoLon!: number;
}
