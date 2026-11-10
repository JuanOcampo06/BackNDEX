import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Max, Min } from 'class-validator';

// Cuerpo del POST /trips y del POST /trips/:id/puntos: donde esta el ciudadano
export class UbicacionRequest {
  @ApiProperty({ example: 4.6486, minimum: -90, maximum: 90 })
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud!: number;

  @ApiProperty({ example: -74.0818, minimum: -180, maximum: 180 })
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud!: number;
}
