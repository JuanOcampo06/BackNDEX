import { ApiProperty } from '@nestjs/swagger';
import { CRITERIOS_RUTA, TIPOS_PASO } from '../../modules/routes';
import type { CriterioRuta, TipoPaso } from '../../modules/routes';

// Forma de una maniobra que responde la API (solo para documentar en Swagger)
export class PasoRutaResponse {
  @ApiProperty({ enum: TIPOS_PASO, example: 'derecha' })
  tipo!: TipoPaso;

  @ApiProperty({ example: 4.6521 })
  latitud!: number;

  @ApiProperty({ example: -74.0832 })
  longitud!: number;

  @ApiProperty({ example: 1630.5, description: 'Metros desde el inicio de la ruta hasta esta maniobra y lo que falta es este valor menos lo que ya recorrio el ciudadano' })
  distanciaDesdeInicioM!: number;
}

// Forma de una ruta que responde la API (solo para documentar en Swagger)
export class RutaResponse {
  @ApiProperty({ enum: CRITERIOS_RUTA, example: 'segura' })
  tipo!: CriterioRuta;

  @ApiProperty({ example: 11204.3, description: 'Metros de toda la ruta' })
  distanciaM!: number;

  @ApiProperty({ example: 2700, description: 'Segundos estimados en bicicleta' })
  duracionS!: number;

  @ApiProperty({ example: 82.4, description: 'Porcentaje de la ruta que va por ciclovia y el resto va por calle normal' })
  porcentajeEnCiclovia!: number;

  @ApiProperty({
    example: [
      [4.6486, -74.0818],
      [4.6521, -74.0832],
    ],
    description: 'Puntos de la ruta como [latitud, longitud] desde el origen hasta el destino y se dibujan directo como una linea en el mapa',
    type: 'array',
    items: { type: 'array', items: { type: 'number' } },
  })
  coordenadas!: [number, number][];

  @ApiProperty({ type: PasoRutaResponse, isArray: true, description: 'Salida, cada giro y llegada en orden' })
  pasos!: PasoRutaResponse[];
}

// Forma de la respuesta del calculo de rutas (solo para documentar en Swagger)
export class RutasResponse {
  @ApiProperty({
    type: RutaResponse,
    isArray: true,
    description:
      'Una ruta por cada tipo y en este orden: segura, equilibrada y rapida. Pueden coincidir cuando el camino mas rapido tambien es el mas seguro',
  })
  rutas!: RutaResponse[];

  @ApiProperty({ example: false, description: 'false mientras las ciclovias no tengan riesgo calculado: la segura solo evita calles y cruces y cuando haya datos tambien esquiva los tramos de riesgo alto' })
  riesgoDisponible!: boolean;
}
