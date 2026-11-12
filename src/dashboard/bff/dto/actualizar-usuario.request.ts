import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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

  @ApiPropertyOptional({
    example: 'clave-inicial-123',
    minLength: 8,
    maxLength: 72,
    description: 'Contrasena para iniciar sesion y se guarda cifrada; sin ella el usuario no puede entrar hasta tener una',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena?: string;
}
