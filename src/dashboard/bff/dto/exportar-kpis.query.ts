import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn } from 'class-validator';
import { KPIS_EXPORTABLES } from '../../modules/kpis';
import type { KpiExportable } from '../../modules/kpis';
import { TableroQuery } from './tablero.query';

const MENSAJE_KPIS = `kpis debe traer al menos un KPI y cada uno debe ser uno de: ${KPIS_EXPORTABLES.join(', ')}`;

// Filtros del tablero mas los KPIs que el usuario eligio en la ventana de exportar
// los filtros son los mismos de cualquier grafica y se heredan de TableroQuery
export class ExportarKpisQuery extends TableroQuery {
  // Acepta kpis=a&kpis=b y tambien kpis=a,b y en los dos casos llega como lista
  @ApiProperty({
    enum: KPIS_EXPORTABLES,
    isArray: true,
    example: ['tarjeta_siniestros', 'siniestros_por_hora'],
    description: 'KPIs a exportar y cada uno sale en su propia hoja',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.split(',').map((kpi) => kpi.trim()).filter((kpi) => kpi !== '') : value,
  )
  @IsArray({ message: MENSAJE_KPIS })
  @ArrayNotEmpty({ message: MENSAJE_KPIS })
  @IsIn(KPIS_EXPORTABLES, { each: true, message: MENSAJE_KPIS })
  kpis!: KpiExportable[];
}
