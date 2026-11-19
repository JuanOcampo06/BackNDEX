import { Controller, Get, Module } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { minutes, ThrottlerModule } from '@nestjs/throttler';
import { DashboardBffModule } from './dashboard/bff/dashboard-bff.module';
import { MobileBffModule } from './mobile/bff/mobile-bff.module';

// Health común a todo el backend; no pertenece a ningún producto.
@ApiTags('Compartido - Estado de la api')
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
  imports: [
    // Contadores del limite de intentos en memoria para toda la api
    // solo cuentan los endpoints marcados con LimiteLogin o LimiteRegistro y cada uno pone su propio limite
    ThrottlerModule.forRoot([{ ttl: minutes(1), limit: 5 }]),
    DashboardBffModule,
    MobileBffModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
