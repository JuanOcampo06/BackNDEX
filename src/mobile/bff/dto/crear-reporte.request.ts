import { IsIn, IsInt, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { CATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte } from '../../modules/reports';

// Cuerpo del POST /reports: lo que el ciudadano manda desde la app
export class CrearReporteRequest {
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @IsIn(CATEGORIAS_REPORTE)
  categoria!: CategoriaReporte;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud!: number;
}
