import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches } from 'class-validator';

// Cuerpo del POST /auth/forgot-password
export class SolicitarRestablecimientoMovilRequest {
  @ApiProperty({ example: 'ana.lopez@demo.local', description: 'Correo con el que se registro el ciudadano' })
  @IsEmail()
  correo!: string;
}

// Cuerpo del POST /auth/reset-password
export class ConfirmarRestablecimientoMovilRequest {
  @ApiProperty({ example: 'ana.lopez@demo.local' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: '4839', description: 'Codigo de 4 digitos que llego al correo' })
  @Matches(/^\d{4}$/, { message: 'El codigo son 4 digitos' })
  codigo!: string;

  @ApiProperty({ example: 'clave-nueva-1', description: 'Entre 8 y 72 caracteres, igual que al registrarse' })
  @IsString()
  @IsNotEmpty()
  contrasenaNueva!: string;
}
