import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { DashboardAuthGuard, SoloRoles } from '../../../platform/auth';
import {
  ActualizarUsuarioUseCase,
  CrearUsuarioUseCase,
  EliminarUsuarioUseCase,
  ListarUsuariosUseCase,
  ObtenerUsuarioUseCase,
  ROL_ADMINISTRADOR,
} from '../../modules/users';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActualizarUsuarioRequest } from '../dto/actualizar-usuario.request';
import { CrearUsuarioRequest } from '../dto/crear-usuario.request';
import { ListarUsuariosQuery } from '../dto/listar-usuarios.query';
import { UsuarioResponse } from '../dto/usuario.response';
import { aSnakeCase } from '../snake-case';

// Convierte los datos a su tipo y rechaza los campos que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Gestion de usuarios del dashboard en /api/dashboard/v1/usuarios y responde en snake_case
// solo el Administrador puede usarla
@ApiTags('Dashboard - Usuarios')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token del dashboard o no es valido o esta vencido' })
@ApiForbiddenResponse({ description: 'El token es valido pero el rol no es Administrador' })
@UseGuards(DashboardAuthGuard)
@SoloRoles(ROL_ADMINISTRADOR)
@Controller('usuarios')
@UseFilters(DomainErrorFilter)
export class UsuariosController {
  constructor(
    private readonly listarUsuarios: ListarUsuariosUseCase,
    private readonly obtenerUsuario: ObtenerUsuarioUseCase,
    private readonly crearUsuario: CrearUsuarioUseCase,
    private readonly actualizarUsuario: ActualizarUsuarioUseCase,
    private readonly eliminarUsuario: EliminarUsuarioUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar los usuarios del dashboard' })
  @ApiOkResponse({ type: UsuarioResponse, isArray: true })
  async listar(@Query(validar) consulta: ListarUsuariosQuery): Promise<unknown> {
    return aSnakeCase(await this.listarUsuarios.execute(consulta));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver un usuario por su id' })
  @ApiOkResponse({ type: UsuarioResponse })
  @ApiNotFoundResponse({ description: 'No existe un usuario con ese id' })
  async obtener(@Param('id', ParseIntPipe) id: number): Promise<unknown> {
    return aSnakeCase(await this.obtenerUsuario.execute(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un usuario del dashboard y con contrasena ya puede iniciar sesion' })
  @ApiCreatedResponse({ type: UsuarioResponse })
  @ApiBadRequestResponse({ description: 'Faltan datos o tienen formato invalido' })
  @ApiConflictResponse({ description: 'Ya existe un usuario con ese correo' })
  async crear(@Body(validar) cuerpo: CrearUsuarioRequest): Promise<unknown> {
    const usuario = await this.crearUsuario.execute({
      nombreCompleto: cuerpo.nombre_completo,
      correo: cuerpo.correo,
      rol: cuerpo.rol,
      entidad: cuerpo.entidad,
      contrasena: cuerpo.contrasena,
    });
    return aSnakeCase(usuario);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar el nombre el correo el rol la entidad o la contrasena de un usuario' })
  @ApiOkResponse({ type: UsuarioResponse })
  @ApiBadRequestResponse({ description: 'No llego ningun campo o alguno tiene formato invalido' })
  @ApiNotFoundResponse({ description: 'No existe un usuario con ese id' })
  @ApiConflictResponse({ description: 'Otro usuario ya tiene ese correo' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body(validar) cuerpo: ActualizarUsuarioRequest,
  ): Promise<unknown> {
    const usuario = await this.actualizarUsuario.execute(id, {
      nombreCompleto: cuerpo.nombre_completo,
      correo: cuerpo.correo,
      rol: cuerpo.rol,
      entidad: cuerpo.entidad,
      contrasena: cuerpo.contrasena,
    });
    return aSnakeCase(usuario);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiNoContentResponse({ description: 'Usuario eliminado y la respuesta no trae cuerpo' })
  @ApiNotFoundResponse({ description: 'No existe un usuario con ese id' })
  eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eliminarUsuario.execute(id);
  }
}
