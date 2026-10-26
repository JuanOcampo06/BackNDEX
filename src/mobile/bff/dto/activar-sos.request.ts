import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

// Cuerpo del POST /sos: quien presiono el boton y donde estaba
export class ActivarSosRequest {
  @ApiProperty({ example: 1, description: 'Id del ciudadano que activa el boton' })
  @IsInt()
  @Min(1)
  usuarioId!: number;

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
