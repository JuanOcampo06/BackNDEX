import { Controller, Get, Module } from '@nestjs/common';
import { DashboardBffModule } from './dashboard/bff/dashboard-bff.module';
import { MobileBffModule } from './mobile/bff/mobile-bff.module';

// Health común a todo el backend; no pertenece a ningún producto.
@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string } {
    return { status: 'ok' };
  }
}

@Module({
  imports: [DashboardBffModule, MobileBffModule],
  controllers: [HealthController],
})
export class AppModule {}
