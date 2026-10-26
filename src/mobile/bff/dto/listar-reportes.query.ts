import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { CATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte } from '../../modules/reports';

// Filtros opcionales del GET /reports en la url
export class ListarReportesQuery {
  // Llega como texto en la url y se convierte a numero
  @ApiPropertyOptional({ example: 1, description: 'Solo los reportes de este ciudadano' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @ApiPropertyOptional({ enum: CATEGORIAS_REPORTE })
  @IsOptional()
  @IsIn(CATEGORIAS_REPORTE)
  categoria?: CategoriaReporte;
}
