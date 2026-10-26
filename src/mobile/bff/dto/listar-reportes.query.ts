import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { CATEGORIAS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte } from '../../modules/reports';

// Filtros opcionales del GET /reports en la url
export class ListarReportesQuery {
  // Llega como texto en la url y se convierte a numero
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  usuarioId?: number;

  @IsOptional()
  @IsIn(CATEGORIAS_REPORTE)
  categoria?: CategoriaReporte;
}
