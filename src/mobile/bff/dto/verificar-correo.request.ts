import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, Matches } from 'class-validator';

// Cuerpo del POST /auth/resend-code
export class ReenviarCodigoRequest {
  @ApiProperty({ example: 'ana.lopez@demo.local', description: 'Correo con el que se registro el ciudadano' })
  @IsEmail()
  correo!: string;
}

// Cuerpo del POST /auth/verify-email
export class VerificarCorreoRequest {
  @ApiProperty({ example: 'ana.lopez@demo.local' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: '4839', description: 'Codigo de 4 digitos que llego al correo al registrarse' })
  @Matches(/^\d{4}$/, { message: 'El codigo son 4 digitos' })
  codigo!: string;
}
