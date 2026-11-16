import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { TIPOS_VEHICULO } from '../../modules/trips';
import type { TipoVehiculo } from '../../modules/trips';
import { UbicacionRequest } from './ubicacion.request';

// Cuerpo del POST /trips: donde sale el ciudadano y en que vehiculo
export class IniciarViajeRequest extends UbicacionRequest {
  @ApiProperty({ enum: TIPOS_VEHICULO, example: 'bicicleta', description: 'Vehiculo en el que va el ciudadano' })
  @IsIn(TIPOS_VEHICULO)
  tipoVehiculo!: TipoVehiculo;
}
