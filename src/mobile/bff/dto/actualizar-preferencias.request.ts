import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsOptional, ValidateNested } from 'class-validator';
import { AVATARES, DISTANCIAS_ALERTA_M, TEMAS } from '../../modules/preferencias';
import type { Avatar, DistanciaAlertaM, Tema } from '../../modules/preferencias';

// Cambios en los avisos: solo los campos que cambian
export class ActualizarAlertasRequest {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  reportesCercanos?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  sonido?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  vibracion?: boolean;

  @ApiPropertyOptional({ enum: DISTANCIAS_ALERTA_M, example: 300 })
  @IsOptional()
  @IsIn(DISTANCIAS_ALERTA_M)
  distanciaM?: DistanciaAlertaM;
}

// Cuerpo del PATCH /me/preferencias: solo los campos que cambian y el resto queda como estaba
export class ActualizarPreferenciasRequest {
  @ApiPropertyOptional({ enum: TEMAS, example: 'oscuro' })
  @IsOptional()
  @IsIn(TEMAS)
  tema?: Tema;

  @ApiPropertyOptional({ enum: AVATARES, example: 'chiva' })
  @IsOptional()
  @IsIn(AVATARES)
  avatar?: Avatar;

  @ApiPropertyOptional({ type: ActualizarAlertasRequest })
  @IsOptional()
  @ValidateNested()
  @Type(() => ActualizarAlertasRequest)
  alertas?: ActualizarAlertasRequest;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  voz?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  notificacionesRuta?: boolean;
}
