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

  @ApiProperty({ example: '483920', description: 'Codigo de 6 digitos que llego al correo al registrarse' })
  @Matches(/^\d{6}$/, { message: 'El codigo son 6 digitos' })
  codigo!: string;
}
