import { existsSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Pagina de Swagger para ver y probar todos los endpoints desde el navegador
import { configurarSwagger } from './swagger/configurar-swagger';

const PREFIJO_API = 'api';
const PUERTO_POR_DEFECTO = 3000;

async function bootstrap(): Promise<void> {
  // En local se lee .env; en Docker las variables llegan desde docker-compose.
  if (existsSync('.env')) {
    process.loadEnvFile('.env');
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(PREFIJO_API);
  // Deja que el frontend llame a la api desde otro puerto
  // con CORS_ORIGIN se limita a una sola direccion y sin ella se acepta cualquiera
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? true });
  // Va despues del prefijo para que Swagger muestre las rutas completas con /api
  configurarSwagger(app);
  await app.listen(Number(process.env.PORT ?? PUERTO_POR_DEFECTO));
}

void bootstrap();
