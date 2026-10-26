import { ApiProperty } from '@nestjs/swagger';
import { ESTADOS_SOS } from '../../modules/sos';
import type { EstadoSos } from '../../modules/sos';

// Forma de la activacion que responde la API (solo para documentar en Swagger)
export class ActivacionSosResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  usuarioId!: number;

  @ApiProperty({ example: 4.6486 })
  latitud!: number;

  @ApiProperty({ example: -74.0818 })
  longitud!: number;

  @ApiProperty({ enum: ESTADOS_SOS, example: 'activa' })
  estado!: EstadoSos;

  @ApiProperty({ example: '2026-10-22T18:30:00.000Z' })
  activadoEn!: string;
}
