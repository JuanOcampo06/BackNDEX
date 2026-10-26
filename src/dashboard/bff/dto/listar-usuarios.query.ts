import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { ROLES } from '../../modules/users';
import type { Rol } from '../../modules/users';

// Filtro opcional del GET /usuarios en la url
export class ListarUsuariosQuery {
  @ApiPropertyOptional({ enum: ROLES, description: 'Solo los usuarios con este rol' })
  @IsOptional()
  @IsIn(ROLES)
  rol?: Rol;
}
