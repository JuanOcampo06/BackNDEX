import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ReportsModule } from '../modules/reports';
import { SosModule } from '../modules/sos';

// Única puerta HTTP de la app móvil: todo colgará de /api/mobile/v1 (aún sin controladores).
@Module({
  imports: [
    ReportsModule,
    SosModule,
    RouterModule.register([{ path: 'mobile/v1', module: MobileBffModule }]),
  ],
})
export class MobileBffModule {}
