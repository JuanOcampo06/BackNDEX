import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CATEGORIAS_REPORTE, SUBCATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte, SubcategoriaReporte } from '../../modules/reports';

// Cuerpo del POST /reports: lo que el ciudadano manda desde la app
// el ciudadano sale del token y no del cuerpo
export class CrearReporteRequest {
  @ApiProperty({ enum: CATEGORIAS_REPORTE, example: 'danos_en_la_via', description: 'Categoria principal que el ciudadano elige primero' })
  @IsIn(CATEGORIAS_REPORTE)
  categoria!: CategoriaReporte;

  @ApiProperty({
    enum: SUBCATEGORIAS_REPORTE,
    example: 'hueco',
    description:
      'Subcategoria de la categoria elegida: danos_en_la_via (hueco, obra, via_cerrada), transito (accidente, semaforo_danado), seguridad (robo, poca_luz, policia), otro (otro)',
  })
  @IsIn(SUBCATEGORIAS_REPORTE)
  subcategoria!: SubcategoriaReporte;

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
