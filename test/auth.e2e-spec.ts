import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('POST /api/dashboard/v1/auth/login (e2e)', () => {
  const ruta = '/api/dashboard/v1/auth/login';
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 200 con el token y el usuario en snake_case', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(ruta)
      .send({ email: 'admin@demo.local', password: 'demo1234' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      access_token: 'token-de-prueba',
      user: { id: '1', full_name: 'Admin Demo', email: 'admin@demo.local', role: 'admin' },
    });
  });

  it('responde 401 con un mensaje genérico si la contraseña es incorrecta', async () => {
    const respuesta = await request(app.getHttpServer())
      .post(ruta)
      .send({ email: 'admin@demo.local', password: 'incorrecta' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body).toEqual({
      codigo: 'CREDENCIALES_INVALIDAS',
      mensaje: 'Correo o contraseña incorrectos',
    });
  });
});
