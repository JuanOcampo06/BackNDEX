import { ApiProperty } from '@nestjs/swagger';
import { COLORES_CONTACTO, ESTADOS_CONTACTO } from '../../modules/contactos';
import type { ColorContacto, EstadoContacto } from '../../modules/contactos';

// Un contacto de emergencia (solo para documentar en Swagger)
export class ContactoResponse {
  @ApiProperty({ example: 4 })
  id!: number;

  @ApiProperty({ example: 'Maria Lopez' })
  nombre!: string;

  @ApiProperty({ example: 'Mamá', description: 'Texto vacio si no se escribio' })
  parentesco!: string;

  @ApiProperty({ example: '3001234567', description: 'Solo numeros' })
  telefono!: string;

  @ApiProperty({ example: 'maria.lopez@correo.com' })
  correo!: string;

  @ApiProperty({ enum: ESTADOS_CONTACTO, example: 'pendiente', description: 'pendiente hasta que el contacto conteste el correo; solo los aceptados salen en el boton SOS; un rechazado queda para avisar al ciudadano y luego se borra' })
  estado!: EstadoContacto;

  @ApiProperty({ enum: COLORES_CONTACTO, example: 0, description: 'Color del circulo: 0 coral, 1 azul, 2 amarillo' })
  color!: ColorContacto;
}

// Contactos del ciudadano en su orden (solo para documentar en Swagger)
export class ContactosResponse {
  @ApiProperty({ type: [ContactoResponse], description: 'En el orden que eligio el ciudadano' })
  contactos!: ContactoResponse[];
}
