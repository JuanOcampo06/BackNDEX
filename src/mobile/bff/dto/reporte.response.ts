import { ApiProperty } from '@nestjs/swagger';
import { CATEGORIAS_REPORTE, ESTADOS_REPORTE } from '../../modules/reports';
import type { CategoriaReporte, EstadoReporte } from '../../modules/reports';

// Forma del reporte que responde la API (solo para documentar en Swagger)
export class ReporteResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  usuarioId!: number;

  @ApiProperty({ enum: CATEGORIAS_REPORTE, example: 'via_en_mal_estado' })
  categoria!: CategoriaReporte;

  @ApiProperty({ example: 'Hueco grande en la ciclorruta', nullable: true, type: String })
  descripcion!: string | null;

  @ApiProperty({ example: 4.6486 })
  latitud!: number;

  @ApiProperty({ example: -74.0818 })
  longitud!: number;

  @ApiProperty({ enum: ESTADOS_REPORTE, example: 'recibido' })
  estado!: EstadoReporte;

  @ApiProperty({ example: '2026-10-22T18:30:00.000Z' })
  creadoEn!: string;
}
