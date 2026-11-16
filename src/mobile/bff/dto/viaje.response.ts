import { ApiProperty } from '@nestjs/swagger';
import { ESTADOS_VIAJE, TIPOS_VEHICULO } from '../../modules/trips';
import type { EstadoViaje, TipoVehiculo } from '../../modules/trips';

// Forma del viaje que responde la API (solo para documentar en Swagger)
export class ViajeResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 1 })
  usuarioId!: number;

  @ApiProperty({ enum: TIPOS_VEHICULO, example: 'bicicleta' })
  tipoVehiculo!: TipoVehiculo;

  @ApiProperty({ enum: ESTADOS_VIAJE, example: 'en_curso' })
  estado!: EstadoViaje;

  @ApiProperty({ example: 1250.5, description: 'Metros recorridos y vale 0 hasta que el viaje se finaliza' })
  distanciaM!: number;

  @ApiProperty({ example: 600, nullable: true, type: Number, description: 'Segundos que duro el viaje y es null hasta que se finaliza' })
  duracionS!: number | null;

  @ApiProperty({
    example: 2,
    description: 'Reportes que el ciudadano envio mientras duraba el viaje y vale 0 hasta que se finaliza',
  })
  cantidadReportes!: number;

  @ApiProperty({ example: '2026-10-22T18:30:00.000Z' })
  iniciadoEn!: string;

  @ApiProperty({ example: null, nullable: true, type: String })
  finalizadoEn!: string | null;
}

// Un punto GPS del recorrido
export class PuntoViajeResponse {
  @ApiProperty({ example: 4.6486 })
  latitud!: number;

  @ApiProperty({ example: -74.0818 })
  longitud!: number;

  @ApiProperty({ example: '2026-10-22T18:31:00.000Z' })
  registradoEn!: string;
}

// El viaje junto a todo su recorrido en el orden en que se registro
export class ViajeDetalleResponse extends ViajeResponse {
  @ApiProperty({ type: PuntoViajeResponse, isArray: true })
  puntos!: PuntoViajeResponse[];
}
