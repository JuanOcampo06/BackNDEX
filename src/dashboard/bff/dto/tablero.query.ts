import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { FUENTES, TIPOS_VEHICULO } from '../../modules/kpis';
import type { Fuente, TipoVehiculo } from '../../modules/kpis';

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

// Filtros que el frontend manda en la url de cualquier grafica o tarjeta del tablero
// todos son opcionales y sin meses se toman los ultimos tres meses
export class TableroQuery {
  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_desde debe tener formato AAAA-MM' })
  mes_desde?: string;

  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_hasta debe tener formato AAAA-MM' })
  mes_hasta?: string;

  // Llega como texto en la url y se convierte a numero
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  localidad_id?: number;

  @IsOptional()
  @IsIn(TIPOS_VEHICULO)
  tipo_vehiculo?: TipoVehiculo;

  @IsOptional()
  @IsIn(FUENTES)
  fuente?: Fuente;
}
