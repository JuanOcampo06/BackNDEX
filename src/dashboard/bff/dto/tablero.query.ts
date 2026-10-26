import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { FUENTES, TIPOS_VEHICULO } from '../../modules/kpis';
import type { Fuente, TipoVehiculo } from '../../modules/kpis';

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

// Filtros que el frontend manda en la url de cualquier grafica o tarjeta del tablero
// todos son opcionales y sin meses se toman los ultimos tres meses
export class TableroQuery {
  @ApiPropertyOptional({ example: '2026-08', description: 'Mes inicial AAAA-MM y sin el se toman los ultimos tres meses' })
  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_desde debe tener formato AAAA-MM' })
  mes_desde?: string;

  @ApiPropertyOptional({ example: '2026-10', description: 'Mes final AAAA-MM y sin el se usa el mes actual' })
  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_hasta debe tener formato AAAA-MM' })
  mes_hasta?: string;

  // Llega como texto en la url y se convierte a numero
  @ApiPropertyOptional({ example: 4, minimum: 1, description: 'Id de la localidad que devuelve tablero/filtros' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  localidad_id?: number;

  @ApiPropertyOptional({ enum: TIPOS_VEHICULO, description: 'Aplica a siniestros y usuarios' })
  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipo_vehiculo?: TipoVehiculo;

  @ApiPropertyOptional({ enum: FUENTES, description: 'Aplica solo a usuarios' })
  @IsOptional()
  @IsIn(FUENTES)
  fuente?: Fuente;
}
