import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UnauthorizedException,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import {
  ApiAcceptedResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardAuthGuard, LimiteLogin, PermitidoSinCambiarContrasena, UsuarioActual } from '../../../platform/auth';
import {
  CambiarContrasenaUseCase,
  ConfirmarRestablecimientoUseCase,
  DomainError,
  LoginResult,
  LoginUseCase,
  SolicitarRestablecimientoUseCase,
} from '../../modules/auth';
import { ActualizarUsuarioUseCase, ObtenerUsuarioUseCase, Usuario } from '../../modules/users';
import { DomainErrorFilter } from '../domain-error.filter';
import { LoginRequest } from '../dto/login.request';
import {
  ActualizarPerfilRequest,
  CambiarContrasenaRequest,
  ConfirmarRestablecimientoRequest,
  PerfilResponse,
  SolicitarRestablecimientoRequest,
} from '../dto/perfil.dto';
import { crearValidador } from '../validacion';

interface UsuarioDeSesion {
  id: string;
  full_name: string;
  email: string;
  role: string;
  entidad: string | null;
  // true si la contrasena la puso otra persona y debe cambiarla antes de usar el resto del dashboard
  debe_cambiar_contrasena: boolean;
}

interface LoginResponse {
  access_token: string;
  user: UsuarioDeSesion;
}

type Perfil = UsuarioDeSesion;

// Rechaza los campos que no existen asi nadie puede cambiar su propio rol desde el perfil
const validar = crearValidador();

// Respuesta 403 de los endpoints del perfil que no se pueden usar hasta cambiar la contrasena
const DESCRIPCION_CAMBIO_REQUERIDO = 'Debe cambiar la contrasena que le puso otra persona antes de continuar (CAMBIO_CONTRASENA_REQUERIDO)';

// Mensaje igual exista o no el correo para no revelar quien esta registrado
const MENSAJE_SOLICITUD = 'Si el correo esta registrado se envio un enlace para restablecer la contrasena';

@ApiTags('Dashboard - Login')
@Controller('auth')
@UseFilters(DomainErrorFilter)
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly obtenerUsuario: ObtenerUsuarioUseCase,
    private readonly actualizarUsuario: ActualizarUsuarioUseCase,
    private readonly solicitarRestablecimiento: SolicitarRestablecimientoUseCase,
    private readonly confirmarRestablecimiento: ConfirmarRestablecimientoUseCase,
    private readonly cambiarContrasena: CambiarContrasenaUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesion con un usuario de la tabla dashboard.usuarios' })
  @ApiOkResponse({ description: 'Token JWT del dashboard con el rol y el user con id full_name email role entidad y debe_cambiar_contrasena' })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido o contrasena vacia' })
  @ApiUnauthorizedResponse({ description: 'Correo o contrasena incorrectos o el usuario no tiene contrasena' })
  @ApiTooManyRequestsResponse({ description: 'Mas de 5 intentos en un minuto desde la misma IP (DEMASIADOS_INTENTOS)' })
  @LimiteLogin()
  async login(@Body(crearValidador({ transform: false, whitelist: false, forbidNonWhitelisted: false })) body: LoginRequest): Promise<LoginResponse> {
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

  @Get('me')
  @UseGuards(DashboardAuthGuard)
  @PermitidoSinCambiarContrasena()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Ver el perfil del usuario dueno del token' })
  @ApiOkResponse({ type: PerfilResponse })
  @ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
  @ApiNotFoundResponse({ description: 'El usuario del token ya no existe' })
  async perfil(@UsuarioActual() usuarioId: number): Promise<Perfil> {
    return aPerfil(await this.obtenerUsuario.execute(usuarioId));
  }

  @Patch('me')
  @UseGuards(DashboardAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Editar el nombre el correo o la entidad del propio perfil' })
  @ApiOkResponse({ type: PerfilResponse })
  @ApiBadRequestResponse({ description: 'No llego ningun campo o alguno tiene formato invalido' })
  @ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
  @ApiConflictResponse({ description: 'Otro usuario ya tiene ese correo' })
  @ApiForbiddenResponse({ description: DESCRIPCION_CAMBIO_REQUERIDO })
  async actualizarPerfil(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: ActualizarPerfilRequest): Promise<Perfil> {
    const usuario = await this.actualizarUsuario.execute(usuarioId, {
      nombreCompleto: cuerpo.full_name,
      correo: cuerpo.email,
      entidad: cuerpo.entidad,
    });
    return aPerfil(usuario);
  }

  @Patch('me/contrasena')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(DashboardAuthGuard)
  @PermitidoSinCambiarContrasena()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar mi contrasena escribiendo la actual' })
  @ApiNoContentResponse({ description: 'Contrasena cambiada, desde ahora solo sirve la nueva y ya no debe cambiarla' })
  @ApiBadRequestResponse({ description: 'La nueva no cumple las reglas (CONTRASENA_INVALIDA)' })
  @ApiUnauthorizedResponse({ description: 'Falta el token o la contrasena actual no coincide (CREDENCIALES_INVALIDAS)' })
  async cambiarMiContrasena(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: CambiarContrasenaRequest): Promise<void> {
    await this.cambiarContrasena.execute({
      usuarioId,
      contrasenaActual: cuerpo.contrasena_actual,
      contrasenaNueva: cuerpo.contrasena_nueva,
    });
  }

  @Post('restablecer-contrasena/solicitar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Pedir el enlace para restablecer la contrasena (llega al correo y dura una hora)' })
  @ApiAcceptedResponse({ description: 'Siempre responde igual exista o no el correo' })
  @ApiBadRequestResponse({ description: 'Correo con formato invalido' })
  async solicitar(@Body(validar) cuerpo: SolicitarRestablecimientoRequest): Promise<{ mensaje: string }> {
    await this.solicitarRestablecimiento.execute({ correo: cuerpo.email, ahora: new Date() });
    return { mensaje: MENSAJE_SOLICITUD };
  }

  @Post('restablecer-contrasena/confirmar')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Cambiar la contrasena con el token del enlace y el token ya no vuelve a servir' })
  @ApiNoContentResponse({ description: 'Contrasena cambiada y ya se puede iniciar sesion con ella' })
  @ApiBadRequestResponse({ description: 'Token invalido usado o vencido (RESTABLECIMIENTO_INVALIDO) o contrasena de menos de 8 caracteres' })
  async confirmar(@Body(validar) cuerpo: ConfirmarRestablecimientoRequest): Promise<void> {
    await this.confirmarRestablecimiento.execute({ token: cuerpo.token, contrasenaNueva: cuerpo.password, ahora: new Date() });
  }

  private aRespuesta({ token, usuario }: LoginResult): LoginResponse {
    return {
      access_token: token,
      user: {
        id: usuario.id,
        full_name: usuario.nombreCompleto,
        email: usuario.correo,
        role: usuario.rol,
        entidad: usuario.entidad,
        debe_cambiar_contrasena: usuario.debeCambiarContrasena,
      },
    };
  }
}

// Misma forma que el user del login
function aPerfil(usuario: Usuario): Perfil {
  return {
    id: String(usuario.id),
    full_name: usuario.nombreCompleto,
    email: usuario.correo,
    role: usuario.rol,
    entidad: usuario.entidad,
    debe_cambiar_contrasena: usuario.debeCambiarContrasena,
  };
}
