import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, UseFilters, UseGuards, ValidationPipe } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiAcceptedResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard, UsuarioActual } from '../../../platform/auth';
import {
  ActualizarContactoUseCase,
  AgregarContactoUseCase,
  ContactoEmergencia,
  EliminarContactoUseCase,
  ListarContactosUseCase,
  OrdenarContactosUseCase,
  ReenviarInvitacionUseCase,
} from '../../modules/contactos';
import { DomainErrorFilter } from '../domain-error.filter';
import { ActualizarContactoRequest, AgregarContactoRequest, OrdenarContactosRequest } from '../dto/contactos.request';
import { ContactoResponse, ContactosResponse } from '../dto/contactos.response';

// Convierte el cuerpo a su tipo y rechaza los campos que no existen
const validar = new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true });

// Contactos de emergencia guardados en la cuenta del ciudadano para que esten en cualquier celular
// cuelgan de /api/mobile/v1/me/contactos, piden token y cada ciudadano solo ve y cambia los suyos
@ApiTags('App movil - Contactos de emergencia')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Falta el token o no es valido' })
@Controller('me/contactos')
@UseGuards(JwtAuthGuard)
@UseFilters(DomainErrorFilter)
export class ContactosController {
  constructor(
    private readonly listarContactos: ListarContactosUseCase,
    private readonly agregarContacto: AgregarContactoUseCase,
    private readonly actualizarContacto: ActualizarContactoUseCase,
    private readonly eliminarContacto: EliminarContactoUseCase,
    private readonly ordenarContactos: OrdenarContactosUseCase,
    private readonly reenviarInvitacion: ReenviarInvitacionUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Contactos de emergencia del ciudadano en su orden' })
  @ApiOkResponse({ type: ContactosResponse })
  async listar(@UsuarioActual() usuarioId: number): Promise<{ contactos: ContactoEmergencia[] }> {
    return { contactos: await this.listarContactos.execute(usuarioId) };
  }

  @Post()
  @ApiOperation({ summary: 'Agregar un contacto al final de la lista, pendiente y con el primer color libre (maximo 3), y enviarle la invitacion por correo' })
  @ApiCreatedResponse({ type: ContactoResponse })
  @ApiBadRequestResponse({ description: 'Datos que no cumplen las reglas (CONTACTO_INVALIDO) o ya tiene 3 contactos (LIMITE_DE_CONTACTOS)' })
  @ApiNotFoundResponse({ description: 'El ciudadano del token ya no existe (USUARIO_NO_ENCONTRADO)' })
  agregar(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: AgregarContactoRequest): Promise<ContactoEmergencia> {
    return this.agregarContacto.execute(usuarioId, { ...cuerpo, parentesco: cuerpo.parentesco ?? '' });
  }

  // Va antes de :id para que "orden" no se tome como un id
  @Put('orden')
  @ApiOperation({ summary: 'Cambiar el orden de los contactos; el primero sale primero en el boton SOS' })
  @ApiOkResponse({ type: ContactosResponse })
  @ApiBadRequestResponse({ description: 'La lista no trae exactamente los contactos del ciudadano (CONTACTO_INVALIDO)' })
  async ordenar(@UsuarioActual() usuarioId: number, @Body(validar) cuerpo: OrdenarContactosRequest): Promise<{ contactos: ContactoEmergencia[] }> {
    return { contactos: await this.ordenarContactos.execute(usuarioId, cuerpo.ids) };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cambiar solo los datos que se mandan de un contacto; si cambia el correo vuelve a quedar pendiente y se le envia la invitacion' })
  @ApiOkResponse({ type: ContactoResponse })
  @ApiBadRequestResponse({ description: 'Datos que no cumplen las reglas (CONTACTO_INVALIDO)' })
  @ApiNotFoundResponse({ description: 'El contacto no existe o es de otro ciudadano (CONTACTO_NO_ENCONTRADO)' })
  actualizar(
    @UsuarioActual() usuarioId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body(validar) cuerpo: ActualizarContactoRequest,
  ): Promise<ContactoEmergencia> {
    return this.actualizarContacto.execute(usuarioId, id, cuerpo);
  }

  @Post(':id/reenviar')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Volver a enviar la invitacion a un contacto que no ha contestado; el enlace anterior deja de servir' })
  @ApiAcceptedResponse({ description: 'Invitacion enviada' })
  @ApiBadRequestResponse({ description: 'Ya contesto (INVITACION_NO_PENDIENTE) o se envio hace menos de 60 segundos (INVITACION_RECIEN_ENVIADA)' })
  @ApiNotFoundResponse({ description: 'El contacto no existe o es de otro ciudadano (CONTACTO_NO_ENCONTRADO)' })
  reenviar(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.reenviarInvitacion.execute(usuarioId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar un contacto y sus datos' })
  @ApiNoContentResponse({ description: 'Borrado' })
  @ApiNotFoundResponse({ description: 'El contacto no existe o es de otro ciudadano (CONTACTO_NO_ENCONTRADO)' })
  eliminar(@UsuarioActual() usuarioId: number, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.eliminarContacto.execute(usuarioId, id);
  }
}
