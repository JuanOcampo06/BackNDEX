import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
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
