import { Body, Controller, Get, Header, HttpCode, HttpStatus, Param, Post, Query, ValidationPipe } from '@nestjs/common';
import { ApiConsumes, ApiOkResponse, ApiOperation, ApiProduces, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DatosInvitacion, DomainError, ResponderInvitacionUseCase } from '../../modules/contactos';
import { ResponderInvitacionRequest } from '../dto/contactos.request';
import { paginaConfirmar, paginaInvalida, paginaRespondida } from '../paginas/invitacion.pagina';

const HTML = 'text/html; charset=utf-8';

// Paginas que abre el contacto desde el correo de invitacion: no piden token porque el contacto no tiene cuenta
// el enlace secreto del correo es lo que lo autoriza y deja de servir al contestar
// cuelgan de /api/mobile/v1/invitaciones y responden HTML para verse en el navegador
@ApiTags('App movil - Contactos de emergencia')
@Controller('invitaciones')
export class InvitacionesController {
  constructor(private readonly responderInvitacion: ResponderInvitacionUseCase) {}

  @Get(':token')
  @Header('Content-Type', HTML)
  @ApiOperation({ summary: 'Pagina que abre el contacto desde el boton Acepto o No acepto del correo; pide confirmar con un clic' })
  @ApiQuery({ name: 'respuesta', required: false, enum: ['acepto', 'rechazo'], description: 'Boton que toco en el correo' })
  @ApiProduces('text/html')
  @ApiOkResponse({ description: 'Pagina para confirmar, o pagina de invitacion no valida si ya se contesto o vencio' })
  async ver(@Param('token') token: string, @Query('respuesta') respuesta?: string): Promise<string> {
    const elegida = respuesta === 'acepto' || respuesta === 'rechazo' ? respuesta : null;
    const datos = await this.siEsValida(() => this.responderInvitacion.ver(token));
    return datos === null ? paginaInvalida() : paginaConfirmar(datos.ciudadano, datos.contacto, elegida);
  }

  @Post(':token')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', HTML)
  @ApiOperation({ summary: 'Guarda la respuesta del contacto (formulario de la pagina) y la app la ve en GET /me/contactos' })
  @ApiConsumes('application/x-www-form-urlencoded')
  @ApiProduces('text/html')
  @ApiOkResponse({ description: 'Pagina con el resultado, o pagina de invitacion no valida' })
  async responder(
    @Param('token') token: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) cuerpo: ResponderInvitacionRequest,
  ): Promise<string> {
    const datos = await this.siEsValida(() => this.responderInvitacion.execute(token, cuerpo.respuesta));
    return datos === null ? paginaInvalida() : paginaRespondida(datos.ciudadano, cuerpo.respuesta);
  }

  // Una invitacion no valida se muestra como pagina y no como JSON porque la ve una persona en el navegador
  private async siEsValida(accion: () => Promise<DatosInvitacion>): Promise<DatosInvitacion | null> {
    try {
      return await accion();
    } catch (error) {
      if (error instanceof DomainError) {
        return null;
      }
      throw error;
    }
  }
}
