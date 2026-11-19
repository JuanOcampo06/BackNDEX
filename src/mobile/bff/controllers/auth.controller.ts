import { Body, Controller, HttpCode, HttpStatus, Post, UseFilters, ValidationPipe } from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  ConfirmarRestablecimientoUseCase,
  IniciarSesionUseCase,
  RegistrarCiudadanoUseCase,
  Sesion,
  SolicitarRestablecimientoUseCase,
  SolicitarVerificacionUseCase,
  VerificarCorreoUseCase,
} from '../../modules/auth';
import { DomainErrorFilter } from '../domain-error.filter';
import { IniciarSesionRequest } from '../dto/iniciar-sesion.request';
import { RegistroRequest } from '../dto/registro.request';
import { ConfirmarRestablecimientoMovilRequest, SolicitarRestablecimientoMovilRequest } from '../dto/restablecer-contrasena.request';
import { SesionResponse } from '../dto/sesion.response';
import { ReenviarCodigoRequest, VerificarCorreoRequest } from '../dto/verificar-correo.request';

// Convierte el cuerpo a su tipo y rechaza los campos que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

const MENSAJE_SOLICITUD = 'Si el correo esta registrado se envio un codigo para restablecer la contrasena';
const MENSAJE_REENVIO = 'Si el correo esta registrado y sin verificar se envio un codigo de verificacion';
const MENSAJE_RESTABLECIDA = 'La contrasena se cambio y ya puedes iniciar sesion con ella';

// Registro, verificacion del correo, inicio de sesion y recuperacion de la contrasena de los ciudadanos de la app movil
// cuelgan de /api/mobile/v1/auth y responden en camelCase con un JWT
@ApiTags('App movil - Autenticacion')
@Controller('auth')
@UseFilters(DomainErrorFilter)
export class AuthController {
  constructor(
    private readonly registrarCiudadano: RegistrarCiudadanoUseCase,
    private readonly iniciarSesion: IniciarSesionUseCase,
    private readonly solicitarRestablecimiento: SolicitarRestablecimientoUseCase,
    private readonly confirmarRestablecimiento: ConfirmarRestablecimientoUseCase,
    private readonly solicitarVerificacion: SolicitarVerificacionUseCase,
    private readonly verificarCorreo: VerificarCorreoUseCase,
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

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar el correo con el codigo que llego al registrarse y recibir la sesion' })
  @ApiOkResponse({ type: SesionResponse })
  @ApiBadRequestResponse({ description: 'Codigo invalido, usado, vencido o con demasiados intentos (VERIFICACION_INVALIDA)' })
  verificarCorreoDelCiudadano(@Body(validar) cuerpo: VerificarCorreoRequest): Promise<Sesion> {
    return this.verificarCorreo.execute({ ...cuerpo, ahora: new Date() });
  }

  @Post('resend-code')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Reenviar el codigo para verificar el correo (llega al correo y dura 15 minutos; no se envia otro antes de un minuto)' })
  @ApiAcceptedResponse({ description: 'Siempre responde igual exista o no el correo' })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido' })
  async reenviarCodigo(@Body(validar) cuerpo: ReenviarCodigoRequest): Promise<{ mensaje: string }> {
    await this.solicitarVerificacion.execute({ correo: cuerpo.correo, ahora: new Date() });
    return { mensaje: MENSAJE_REENVIO };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Pedir el codigo para restablecer la contrasena (llega al correo y dura 15 minutos)' })
  @ApiAcceptedResponse({ description: 'Siempre responde igual exista o no el correo' })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido' })
  async olvideContrasena(@Body(validar) cuerpo: SolicitarRestablecimientoMovilRequest): Promise<{ mensaje: string }> {
    await this.solicitarRestablecimiento.execute({ correo: cuerpo.correo, ahora: new Date() });
    return { mensaje: MENSAJE_SOLICITUD };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar la contrasena con el codigo que llego al correo y el codigo ya no vuelve a servir' })
  @ApiOkResponse({ description: 'Contrasena cambiada y ya se puede iniciar sesion con ella' })
  @ApiBadRequestResponse({
    description: 'Codigo invalido, usado, vencido o con demasiados intentos (RESTABLECIMIENTO_INVALIDO) o contrasena que no cumple las reglas (CIUDADANO_INVALIDO)',
  })
  async restablecerContrasena(@Body(validar) cuerpo: ConfirmarRestablecimientoMovilRequest): Promise<{ mensaje: string }> {
    await this.confirmarRestablecimiento.execute({ ...cuerpo, ahora: new Date() });
    return { mensaje: MENSAJE_RESTABLECIDA };
  }
}
