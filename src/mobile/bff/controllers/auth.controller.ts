import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { IniciarSesionUseCase, RegistrarCiudadanoUseCase, Sesion } from '../../modules/auth';
import { DomainErrorFilter } from '../domain-error.filter';
import { IniciarSesionRequest } from '../dto/iniciar-sesion.request';
import { RegistroRequest } from '../dto/registro.request';
import { SesionResponse } from '../dto/sesion.response';

// Convierte el cuerpo a su tipo y rechaza los campos que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Registro e inicio de sesion de los ciudadanos de la app movil
// cuelgan de /api/mobile/v1/auth y responden en camelCase con un JWT
@ApiTags('App movil - Autenticacion')
@Controller('auth')
@UseFilters(DomainErrorFilter)
export class AuthController {
  constructor(
    private readonly registrarCiudadano: RegistrarCiudadanoUseCase,
    private readonly iniciarSesion: IniciarSesionUseCase,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un ciudadano y dejarlo con la sesion abierta' })
  @ApiCreatedResponse({ type: SesionResponse })
  @ApiBadRequestResponse({ description: 'Datos invalidos' })
  @ApiConflictResponse({ description: 'Ya existe un ciudadano con ese correo' })
  registrar(@Body(validar) cuerpo: RegistroRequest): Promise<Sesion> {
    return this.registrarCiudadano.execute(cuerpo);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion con correo y contrasena' })
  @ApiOkResponse({ type: SesionResponse })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido o contrasena vacia' })
  @ApiUnauthorizedResponse({ description: 'Correo o contrasena incorrectos' })
  login(@Body(validar) cuerpo: IniciarSesionRequest): Promise<Sesion> {
    return this.iniciarSesion.execute(cuerpo);
  }
}
