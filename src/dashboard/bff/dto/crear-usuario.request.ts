import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ROLES } from '../../modules/users';
import type { Rol } from '../../modules/users';

// Cuerpo del POST /usuarios en snake_case como todo el dashboard
export class CrearUsuarioRequest {
  @ApiProperty({ example: 'Ana Lopez', maxLength: 120 })
  @IsString()
  @MaxLength(120)
  nombre_completo!: string;

  @ApiProperty({ example: 'ana.lopez@demo.local' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ enum: ROLES, example: 'lector', description: 'admin administra usuarios y lector solo consulta' })
  @IsIn(ROLES)
  rol!: Rol;

  @ApiPropertyOptional({ example: 'Secretaría Distrital de Movilidad', maxLength: 120, description: 'Entidad a la que pertenece el usuario y un texto vacio la borra' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entidad?: string;

  // Las reglas de largo mayuscula minuscula y numero las revisa el dominio para responder un solo mensaje en espanol
  @ApiProperty({ example: 'Clave-inicial1', minLength: 8, maxLength: 72, description: 'De 8 a 72 caracteres con al menos una mayúscula, una minúscula y un número. Se guarda cifrada' })
  @IsString()
  contrasena!: string;
}
