import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLES } from '../../modules/users';
import type { Rol } from '../../modules/users';

// Cuerpo del PATCH /usuarios/:id y solo se envian los campos que cambian
export class ActualizarUsuarioRequest {
  @ApiPropertyOptional({ example: 'Ana Maria Lopez', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre_completo?: string;

  @ApiPropertyOptional({ example: 'ana.maria@demo.local' })
  @IsOptional()
  @IsEmail()
  correo?: string;

  @ApiPropertyOptional({ enum: ROLES, example: 'admin' })
  @IsOptional()
  @IsIn(ROLES)
  rol?: Rol;
}
