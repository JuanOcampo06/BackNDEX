import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, Max, Min } from 'class-validator';
import { CRITERIOS_RUTA } from '../../modules/routes';
import type { CriterioRuta } from '../../modules/routes';

// Parametros del GET /routes/recalcular en la url: donde esta el ciudadano, a donde va y que tipo de ruta habia elegido
export class RecalcularRutaQuery {
  @ApiProperty({ example: 4.6553, minimum: -90, maximum: 90, description: 'Latitud de donde esta el ciudadano ahora' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  actualLat!: number;

  @ApiProperty({ example: -74.0779, minimum: -180, maximum: 180, description: 'Longitud de donde esta el ciudadano ahora' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  actualLon!: number;

  @ApiProperty({ example: 4.6702, minimum: -90, maximum: 90, description: 'Latitud del destino, el mismo de la ruta original' })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destinoLat!: number;

  @ApiProperty({ example: -74.0623, minimum: -180, maximum: 180, description: 'Longitud del destino, el mismo de la ruta original' })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destinoLon!: number;

  @ApiProperty({ enum: CRITERIOS_RUTA, example: 'segura', description: 'Tipo de ruta que el ciudadano venia siguiendo' })
  @IsIn(CRITERIOS_RUTA)
  tipo!: CriterioRuta;
}
