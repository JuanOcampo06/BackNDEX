import { Controller, Get, Module } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DashboardBffModule } from './dashboard/bff/dashboard-bff.module';
import { MobileBffModule } from './mobile/bff/mobile-bff.module';

// Health común a todo el backend; no pertenece a ningún producto.
@ApiTags('General')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Comprobar que la api esta viva' })
  @ApiOkResponse({ description: 'Responde status ok', schema: { example: { status: 'ok' } } })
  check(): { status: string } {
    return { status: 'ok' };
  }
}

@Module({
  imports: [DashboardBffModule, MobileBffModule],
  controllers: [HealthController],
})
export class AppModule {}
