import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, IsArray, IsIn, IsInt, IsOptional, Matches, Min } from 'class-validator';
import { TIPOS_VEHICULO } from '../../modules/kpis';
import type { TipoVehiculo } from '../../modules/kpis';

const FORMATO_MES = /^\d{4}-(0[1-9]|1[0-2])$/;

const MENSAJE_LOCALIDAD = 'localidad_id debe traer uno o varios ids enteros mayores que 0';
const MENSAJE_VEHICULO = `tipo_vehiculo debe traer uno o varios de: ${TIPOS_VEHICULO.join(', ')}`;

// Un filtro acepta varios valores y llegan como ?filtro=a&filtro=b o como ?filtro=a,b y siempre quedan en lista
function aLista(valor: unknown): unknown {
  if (valor === undefined) {
    return undefined;
  }
  return [valor]
    .flat()
    .flatMap((parte) => String(parte).split(','))
    .map((parte) => parte.trim())
    .filter((parte) => parte !== '');
}

function aListaDeNumeros(valor: unknown): unknown {
  const lista = aLista(valor);
  return Array.isArray(lista) ? lista.map(Number) : lista;
}

// Filtros que el frontend manda en la url de cualquier grafica o tarjeta del tablero
// todos son opcionales y sin meses se toman los ultimos tres meses
// los meses son un rango y localidad y vehiculo aceptan uno o varios valores
export class TableroQuery {
  @ApiPropertyOptional({ example: '2025-10', description: 'Mes inicial AAAA-MM y sin el se toman los ultimos tres meses y el anuario solo trae 2025' })
  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_desde debe tener formato AAAA-MM' })
  mes_desde?: string;

  @ApiPropertyOptional({ example: '2025-12', description: 'Mes final AAAA-MM y sin el se usa el mes actual' })
  @IsOptional()
  @Matches(FORMATO_MES, { message: 'mes_hasta debe tener formato AAAA-MM' })
  mes_hasta?: string;

  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    example: [8],
    minimum: 1,
    description: 'Uno o varios ids de localidad que devuelve tablero/filtros y se mandan repetidos o separados por comas',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => aListaDeNumeros(value))
  @IsArray({ message: MENSAJE_LOCALIDAD })
  @ArrayNotEmpty({ message: MENSAJE_LOCALIDAD })
  @IsInt({ each: true, message: MENSAJE_LOCALIDAD })
  @Min(1, { each: true, message: MENSAJE_LOCALIDAD })
  localidad_id?: number[];

  @ApiPropertyOptional({
    enum: TIPOS_VEHICULO,
    isArray: true,
    description: 'Uno o varios tipos de vehiculo y aplica a siniestros y usuarios',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => aLista(value))
  @IsArray({ message: MENSAJE_VEHICULO })
  @ArrayNotEmpty({ message: MENSAJE_VEHICULO })
  @IsIn(TIPOS_VEHICULO, { each: true, message: MENSAJE_VEHICULO })
  tipo_vehiculo?: TipoVehiculo[];
}
