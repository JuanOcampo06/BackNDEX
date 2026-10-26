import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte } from '../../modules/reports';

// Cuerpo del POST /reports: lo que el ciudadano manda desde la app
export class CrearReporteRequest {
  @ApiProperty({ example: 1, description: 'Id del ciudadano que reporta' })
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @ApiProperty({ enum: CATEGORIAS_REPORTE, example: 'via_en_mal_estado' })
  @IsIn(CATEGORIAS_REPORTE)
  categoria!: CategoriaReporte;

  @ApiPropertyOptional({ example: 'Hueco grande en la ciclorruta', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @ApiProperty({ example: 4.6486, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud!: number;

  @ApiProperty({ example: -74.0818, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud!: number;
}
