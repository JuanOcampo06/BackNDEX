import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
// Pagina de Swagger para ver y probar todos los endpoints desde el navegador
import { configurarSwagger } from './swagger/configurar-swagger';

const PREFIJO_API = 'api';
const PUERTO_POR_DEFECTO = 3001;

async function bootstrap(): Promise<void> {
  // En local se lee .env; en Docker las variables llegan desde docker-compose.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // La api queda detras de un balanceador (ALB) que agrega la IP del cliente en X-Forwarded-For
  // confiar en ese unico salto hace que el limite de intentos cuente por cliente y no por la IP del balanceador
  app.set('trust proxy', 1);
  app.setGlobalPrefix(PREFIJO_API);
  // Deja que el frontend llame a la api desde otro puerto
  // con CORS_ORIGIN se limita a una sola direccion y sin ella se acepta cualquiera
  // exposedHeaders deja que el frontend lea el nombre del archivo de la descarga del Excel
  app.enableCors({ origin: process.env.CORS_ORIGIN || true, exposedHeaders: ['Content-Disposition'] });
  // Va despues del prefijo para que Swagger muestre las rutas completas con /api
  configurarSwagger(app);
  await app.listen(Number(process.env.PORT ?? PUERTO_POR_DEFECTO));
}

void bootstrap();
