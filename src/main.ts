import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const PREFIJO_API = 'api';
const PUERTO_POR_DEFECTO = 3000;

async function bootstrap(): Promise<void> {
  // En local se lee .env; en Docker las variables llegan desde docker-compose.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(PREFIJO_API);
  await app.listen(Number(process.env.PORT ?? PUERTO_POR_DEFECTO));
}

void bootstrap();
