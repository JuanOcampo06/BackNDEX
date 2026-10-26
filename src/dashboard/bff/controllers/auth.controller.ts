import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { DomainError, LoginResult, LoginUseCase } from '../../modules/auth';
import { LoginRequest } from '../dto/login.request';

interface LoginResponse {
  access_token: string;
  user: { id: string; full_name: string; email: string; role: string };
}

@ApiTags('Dashboard - Login')
@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion con el usuario de demostracion' })
  @ApiOkResponse({ description: 'Token de prueba y datos del usuario en snake_case' })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido o contrasena vacia' })
  @ApiUnauthorizedResponse({ description: 'Correo o contrasena incorrectos' })
  async login(@Body(new ValidationPipe()) body: LoginRequest): Promise<LoginResponse> {
    try {
      const resultado = await this.loginUseCase.execute({
        correo: body.email,
        contrasena: body.password,
      });
      return this.aRespuesta(resultado);
    } catch (error) {
      if (error instanceof DomainError) {
        throw new UnauthorizedException({ codigo: error.codigo, mensaje: error.message });
      }
      throw error;
    }
  }

  private aRespuesta({ token, usuario }: LoginResult): LoginResponse {
    return {
      access_token: token,
      user: {
        id: usuario.id,
        full_name: usuario.nombreCompleto,
        email: usuario.correo,
        role: usuario.rol,
      },
    };
  }
}
