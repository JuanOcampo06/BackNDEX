import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

// Cuerpo del POST /auth/login
export class IniciarSesionRequest {
  @ApiProperty({ example: 'ana.lopez@demo.local' })
  @IsEmail()
  correo!: string;

  @ApiProperty({ example: 'demo1234' })
  @IsString()
  @IsNotEmpty()
  contrasena!: string;
}
