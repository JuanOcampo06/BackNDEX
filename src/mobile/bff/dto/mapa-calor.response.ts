import { ApiProperty } from '@nestjs/swagger';

// Una mancha del mapa de calor (solo para documentar en Swagger)
export class PuntoDeCalorResponse {
  @ApiProperty({ example: 4.60124, description: 'Centro de la mancha' })
  latitud!: number;

  @ApiProperty({ example: -74.07213 })
  longitud!: number;

  @ApiProperty({ example: 0.85, description: 'Que tanto se concentran siniestros y reportes ahi, de 0 (poco) a 1 (mucho)' })
  peso!: number;

  @ApiProperty({ example: 450, description: 'Hasta donde llega la mancha en metros' })
  radioM!: number;
}

// Mapa de calor de toda la ciudad (solo para documentar en Swagger)
export class MapaCalorResponse {
  @ApiProperty({ example: 1291 })
  total!: number;

  @ApiProperty({ type: [PuntoDeCalorResponse], description: 'Ordenadas de mayor a menor peso' })
  puntos!: PuntoDeCalorResponse[];
}
