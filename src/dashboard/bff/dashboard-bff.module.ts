import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from '../modules/auth';
import { UsersModule } from '../modules/users';
import { KpisModule } from '../modules/kpis';
// Modulo comun de ciclovias que tambien usa la app movil
import { CicloviasModule } from '../../common/modules/ciclovias';
import { AuthController } from './controllers/auth.controller';
// Controlador nuevo con los endpoints de las tarjetas y graficas del tablero
import { TableroController } from './controllers/tablero.controller';
import { CicloviasController } from './controllers/ciclovias.controller';
// Controlador para crear editar y eliminar usuarios del dashboard
import { UsuariosController } from './controllers/usuarios.controller';

// Única puerta HTTP del dashboard: todo cuelga de /api/dashboard/v1.
@Module({
  imports: [
    AuthModule,
    UsersModule,
    KpisModule,
    CicloviasModule,
    RouterModule.register([{ path: 'dashboard/v1', module: DashboardBffModule }]),
  ],
  controllers: [AuthController, TableroController, CicloviasController, UsuariosController],
})
export class DashboardBffModule {}
