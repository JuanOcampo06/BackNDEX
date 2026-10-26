import { ApiProperty } from '@nestjs/swagger';
import { ROLES } from '../../modules/users';
import type { Rol } from '../../modules/users';

// Forma del usuario que responde la api en snake_case (solo para documentar en Swagger)
export class UsuarioResponse {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Admin Demo' })
  nombre_completo!: string;

  @ApiProperty({ example: 'admin@demo.local' })
  correo!: string;

  @ApiProperty({ enum: ROLES, example: 'admin' })
  rol!: Rol;

  @ApiProperty({ example: '2026-10-27T15:00:00.000Z' })
  creado_en!: string;

  @ApiProperty({ example: '2026-10-27T15:00:00.000Z' })
  actualizado_en!: string;
}
