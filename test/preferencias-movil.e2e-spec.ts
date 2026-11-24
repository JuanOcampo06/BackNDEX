import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PREFERENCIAS_REPOSITORY } from '../src/mobile/modules/preferencias';
import type { Preferencias, PreferenciasRepositoryPort } from '../src/mobile/modules/preferencias';
import { firmarToken } from '../src/platform/auth';

describe('Preferencias de la app movil (e2e)', () => {
  const ruta = '/api/mobile/v1/me/preferencias';
  let app: INestApplication;
  let autorizacion: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
    autorizacion = `Bearer ${firmarToken(1)}`;
    // Sin base de datos en las pruebas: las preferencias quedan en memoria
    const guardadas = new Map<number, Preferencias>();
    const repositorio: PreferenciasRepositoryPort = {
      buscar: async (usuarioId) => guardadas.get(usuarioId) ?? null,
      guardar: async (usuarioId, preferencias) => {
        guardadas.set(usuarioId, preferencias);
        return true;
      },
    };
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PREFERENCIAS_REPOSITORY)
      .useValue(repositorio)
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());

  it('responde 401 sin token', async () => {
    expect((await http().get(ruta)).status).toBe(401);
  });

  it('sin nada guardado devuelve los valores por defecto', async () => {
    const respuesta = await http().get(ruta).set('Authorization', autorizacion);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      tema: 'sistema',
      avatar: 'flecha',
      alertas: { reportesCercanos: true, sonido: false, vibracion: true, distanciaM: 300 },
      voz: true,
      notificacionesRuta: true,
    });
  });

  it('el PATCH cambia solo lo que se manda y el GET lo devuelve igual', async () => {
    const cambio = await http().patch(ruta).set('Authorization', autorizacion).send({ tema: 'oscuro', alertas: { sonido: true } });
    const leido = await http().get(ruta).set('Authorization', autorizacion);

    expect(cambio.status).toBe(200);
    expect(leido.body).toEqual(cambio.body);
    expect(leido.body).toMatchObject({ tema: 'oscuro', avatar: 'flecha', alertas: { sonido: true, vibracion: true } });
  });

  it('responde 400 con opciones que no existen o campos que sobran', async () => {
    const malos = await Promise.all([
      http().patch(ruta).set('Authorization', autorizacion).send({ tema: 'azul' }),
      http().patch(ruta).set('Authorization', autorizacion).send({ alertas: { distanciaM: 250 } }),
      http().patch(ruta).set('Authorization', autorizacion).send({ voz: 'si' }),
      http().patch(ruta).set('Authorization', autorizacion).send({ color: 'rojo' }),
    ]);

    expect(malos.map((r) => r.status)).toEqual([400, 400, 400, 400]);
  });
});
