import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CATEGORIAS_REPORTE, SUBCATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte, SubcategoriaReporte } from '../../modules/reports';

// Filtros opcionales del GET /reports en la url y siempre se listan solo los reportes del ciudadano del token
export class ListarReportesQuery {
  @ApiPropertyOptional({ enum: CATEGORIAS_REPORTE })
  @IsOptional()
  @IsIn(CATEGORIAS_REPORTE)
  categoria?: CategoriaReporte;

  @ApiPropertyOptional({ enum: SUBCATEGORIAS_REPORTE })
  @IsOptional()
  @IsIn(SUBCATEGORIAS_REPORTE)
  subcategoria?: SubcategoriaReporte;
}
