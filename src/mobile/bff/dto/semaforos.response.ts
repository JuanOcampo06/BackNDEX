import { ApiProperty } from '@nestjs/swagger';

// Un semaforo de ciclorruta (solo para documentar en Swagger)
export class SemaforoResponse {
  @ApiProperty({ example: 265596948, description: 'Id del semaforo en OpenStreetMap' })
  id!: number;

  @ApiProperty({ example: 4.670836 })
  latitud!: number;

  @ApiProperty({ example: -74.0495 })
  longitud!: number;
}

// Semaforos de la zona del mapa (solo para documentar en Swagger)
export class SemaforosResponse {
  @ApiProperty({ example: 1 })
  total!: number;

  @ApiProperty({ type: [SemaforoResponse] })
  semaforos!: SemaforoResponse[];
}
