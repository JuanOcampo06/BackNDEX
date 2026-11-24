import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { RESPUESTAS_INVITACION } from '../../modules/contactos';
import type { RespuestaInvitacion } from '../../modules/contactos';

// Cuerpo del POST /me/contactos: lo que se escribe en el formulario de la app
// las reglas (celular colombiano, largo del nombre, correo) las revisa el dominio
export class AgregarContactoRequest {
  @ApiProperty({ example: 'Maria Lopez', description: 'Entre 1 y 60 caracteres' })
  @IsString()
  nombre!: string;

  @ApiPropertyOptional({ example: 'Mamá', description: 'Opcional, hasta 30 caracteres' })
  @IsOptional()
  @IsString()
  parentesco?: string;

  @ApiProperty({ example: '300 123 4567', description: 'Celular colombiano de 10 numeros que empieza por 3; se guarda solo con numeros' })
  @IsString()
  telefono!: string;

  @ApiProperty({ example: 'maria.lopez@correo.com', description: 'A este correo le llega la invitacion para aceptar o no' })
  @IsString()
  correo!: string;
}

// Cuerpo del PATCH /me/contactos/:id: solo los campos que cambian
// el estado no se manda: solo cambia cuando el contacto contesta la invitacion del correo
export class ActualizarContactoRequest {
  @ApiPropertyOptional({ example: 'Maria Lopez' })
  @IsOptional()
  @IsString()
  nombre?: string;

  @ApiPropertyOptional({ example: 'Mamá' })
  @IsOptional()
  @IsString()
  parentesco?: string;

  @ApiPropertyOptional({ example: '300 123 4567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiPropertyOptional({ example: 'maria.lopez@correo.com', description: 'Si cambia, el contacto vuelve a quedar pendiente y se le envia la invitacion al correo nuevo' })
  @IsOptional()
  @IsString()
  correo?: string;
}

// Cuerpo del PUT /me/contactos/orden
export class OrdenarContactosRequest {
  @ApiProperty({ example: [3, 1, 2], description: 'Ids de todos los contactos del ciudadano en el orden nuevo; el primero sale primero en el SOS' })
  @IsArray()
  @IsInt({ each: true })
  ids!: number[];
}

// Cuerpo del formulario de la pagina de la invitacion (POST /invitaciones/:token)
export class ResponderInvitacionRequest {
  @ApiProperty({ enum: RESPUESTAS_INVITACION, example: 'acepto' })
  @IsIn(RESPUESTAS_INVITACION)
  respuesta!: RespuestaInvitacion;
}
