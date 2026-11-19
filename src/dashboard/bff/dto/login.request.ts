import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginRequest {
  // Los ejemplos de Swagger son las credenciales de la demo
  @ApiProperty({ example: 'usuario@entidad.gov.co' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Contrasena-segura1' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
