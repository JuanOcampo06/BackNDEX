import { ApiProperty } from '@nestjs/swagger';
import { GENEROS } from '../../modules/auth';
import type { Genero } from '../../modules/auth';

// Forma del ciudadano que responde la API (solo para documentar en Swagger)
export class CiudadanoResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Ana Lopez' })
  nombreCompleto!: string;

  @ApiProperty({ example: 'ana.lopez@demo.local' })
  correo!: string;

  @ApiProperty({ example: '3001234567', nullable: true, type: String })
  telefono!: string | null;

  @ApiProperty({ example: '1995-04-23', description: 'Formato AAAA-MM-DD' })
  fechaNacimiento!: string;

  @ApiProperty({ enum: GENEROS, example: 'femenino' })
  genero!: Genero;
}

// Forma de la sesion que responde el registro y el login (solo para documentar en Swagger)
export class SesionResponse {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'Se manda en cada peticion como Authorization: Bearer <token>' })
  accessToken!: string;

  @ApiProperty({ type: CiudadanoResponse })
  ciudadano!: CiudadanoResponse;
}
