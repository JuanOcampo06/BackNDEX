import { IsInt, IsNumber, Max, Min } from 'class-validator';

// Cuerpo del POST /sos: quien presiono el boton y donde estaba
export class ActivarSosRequest {
  @IsInt()
  @Min(1)
  usuarioId!: number;

  @IsNumber()
  @Min(-90)
  @Max(90)
  latitud!: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  longitud!: number;
}
