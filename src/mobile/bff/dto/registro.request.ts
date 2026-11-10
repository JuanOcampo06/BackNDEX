import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { GENEROS } from '../../modules/auth';
import type { Genero } from '../../modules/auth';

// Cuerpo del POST /auth/register: los datos con los que se crea la cuenta del ciudadano
export class RegistroRequest {
  @ApiProperty({ example: 'Ana Lopez', maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombreCompleto!: string;

  @ApiProperty({ example: 'ana.lopez@demo.local' })
  @IsEmail()
  correo!: string;

  @ApiPropertyOptional({ example: '3001234567', description: 'Entre 7 y 15 digitos y puede empezar con +' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ example: '1995-04-23', description: 'Formato AAAA-MM-DD. La app es solo para mayores de 18 anos' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fechaNacimiento debe tener el formato AAAA-MM-DD' })
  fechaNacimiento!: string;

  @ApiProperty({ enum: GENEROS, example: 'femenino', description: 'La app ofrece Femenino, Masculino, No binario y Prefiero no decirlo' })
  @IsIn(GENEROS)
  genero!: Genero;

  @ApiProperty({ example: 'demo1234', minLength: 8, maxLength: 72 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  contrasena!: string;
}
