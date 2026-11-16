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

  @ApiPropertyOptional({ example: 'Secretaría Distrital de Movilidad', maxLength: 120, description: 'Entidad a la que pertenece el usuario y un texto vacio la borra' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entidad?: string;

  // Las reglas de largo mayuscula minuscula y numero las revisa el dominio para responder un solo mensaje en espanol
  @ApiPropertyOptional({ example: 'Clave-nueva1', minLength: 8, maxLength: 72, description: 'Asignar una contraseña nueva. De 8 a 72 caracteres con al menos una mayúscula, una minúscula y un número. Se guarda cifrada' })
  @IsOptional()
  @IsString()
  contrasena?: string;
}
