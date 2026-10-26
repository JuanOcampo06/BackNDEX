import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';
import { ReportsModule } from '../modules/reports';
import { SosModule } from '../modules/sos';
// Modulo comun de ciclovias que tambien usa el dashboard
import { CicloviasModule } from '../../common/modules/ciclovias';
// Primer controlador de la app movil con las ciclovias de la zona del mapa
import { CicloviasController } from './controllers/ciclovias.controller';
// Controladores de reportes ciudadanos y boton de panico de la app
import { ReportsController } from './controllers/reports.controller';
import { SosController } from './controllers/sos.controller';

// Única puerta HTTP de la app móvil: todo cuelga de /api/mobile/v1.
@Module({
  imports: [
    ReportsModule,
    SosModule,
    CicloviasModule,
    RouterModule.register([{ path: 'mobile/v1', module: MobileBffModule }]),
  ],
  controllers: [CicloviasController, ReportsController, SosController],
})
export class MobileBffModule {}
