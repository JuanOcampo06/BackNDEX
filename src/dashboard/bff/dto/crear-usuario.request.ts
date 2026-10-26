import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsString, MaxLength } from 'class-validator';
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
}
