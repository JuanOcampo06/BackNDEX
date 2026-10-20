import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { AuthModule } from '../modules/auth';
import { UsersModule } from '../modules/users';
import { KpisModule } from '../modules/kpis';
import { AuthController } from './controllers/auth.controller';

// Única puerta HTTP del dashboard: todo cuelga de /api/dashboard/v1.
@Module({
  imports: [
    AuthModule,
    UsersModule,
    KpisModule,
    RouterModule.register([{ path: 'dashboard/v1', module: DashboardBffModule }]),
  ],
  controllers: [AuthController],
})
export class DashboardBffModule {}
