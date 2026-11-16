import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

// Usa los mismos nombres que el user del login para que el frontend maneje una sola forma de usuario

// Respuesta de GET y PATCH /auth/me (solo para documentar en Swagger)
export class PerfilResponse {
  @ApiProperty({ example: '1' })
  id!: string;

  @ApiProperty({ example: 'Admin Demo' })
  full_name!: string;

  @ApiProperty({ example: 'admin@demo.local' })
  email!: string;

  @ApiProperty({ example: 'admin', description: 'admin es el Administrador y lector el Usuario' })
  role!: string;

  @ApiProperty({ example: 'Secretaría Distrital de Movilidad', nullable: true, type: String })
  entidad!: string | null;
}

// Cuerpo de PATCH /auth/me y solo se envian los campos que cambian
// el rol no se puede cambiar aqui porque solo lo cambia el Administrador desde /usuarios
export class ActualizarPerfilRequest {
  @ApiPropertyOptional({ example: 'Ana Maria Lopez', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  full_name?: string;

  @ApiPropertyOptional({ example: 'ana.maria@demo.local' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'Secretaría Distrital de Movilidad', maxLength: 120, description: 'Un texto vacio la borra' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  entidad?: string;
}

// Cuerpo de POST /auth/restablecer-contrasena/solicitar
export class SolicitarRestablecimientoRequest {
  @ApiProperty({ example: 'admin@demo.local' })
  @IsEmail()
  email!: string;
}

// Cuerpo de POST /auth/restablecer-contrasena/confirmar con el token que llego en el enlace
export class ConfirmarRestablecimientoRequest {
  @ApiProperty({ example: 'token-del-enlace' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'nueva-clave-123', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
