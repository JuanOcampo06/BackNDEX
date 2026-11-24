import { ApiProperty } from '@nestjs/swagger';
import { AVATARES, DISTANCIAS_ALERTA_M, TEMAS } from '../../modules/preferencias';
import type { Avatar, DistanciaAlertaM, Tema } from '../../modules/preferencias';

// Avisos de reportes cercanos (solo para documentar en Swagger)
export class AlertasResponse {
  @ApiProperty({ example: true, description: 'Avisar cuando hay un reporte cerca' })
  reportesCercanos!: boolean;

  @ApiProperty({ example: false })
  sonido!: boolean;

  @ApiProperty({ example: true })
  vibracion!: boolean;

  @ApiProperty({ enum: DISTANCIAS_ALERTA_M, example: 300, description: 'A cuantos metros de un reporte se avisa' })
  distanciaM!: DistanciaAlertaM;
}

// Preferencias guardadas en la cuenta del ciudadano (solo para documentar en Swagger)
export class PreferenciasResponse {
  @ApiProperty({ enum: TEMAS, example: 'sistema' })
  tema!: Tema;

  @ApiProperty({ enum: AVATARES, example: 'flecha', description: 'Como se ve el ciudadano en el mapa durante la ruta' })
  avatar!: Avatar;

  @ApiProperty({ type: AlertasResponse })
  alertas!: AlertasResponse;

  @ApiProperty({ example: true, description: 'Indicaciones por voz durante la ruta' })
  voz!: boolean;

  @ApiProperty({ example: true, description: 'Notificaciones durante la ruta' })
  notificacionesRuta!: boolean;
}
