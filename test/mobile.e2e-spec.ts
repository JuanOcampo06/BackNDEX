import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { REPORTES_REPOSITORY, ReportesRepositoryPort } from '../src/mobile/modules/reports/application/reportes.repository.port';
import { Reporte } from '../src/mobile/modules/reports/domain/reporte';

// Repositorio falso para probar la puerta HTTP sin necesitar PostgreSQL
function crearRepositorioFalso(): ReportesRepositoryPort {
  const guardados: Reporte[] = [];
  return {
    existeUsuario: async (id) => id === 1,
    guardar: async (nuevo) => {
      const reporte: Reporte = { id: guardados.length + 1, ...nuevo, estado: 'recibido', creadoEn: '2026-10-22T18:00:00.000Z' };
      guardados.push(reporte);
      return reporte;
    },
    listar: async () => guardados,
    buscarPorId: async (id) => guardados.find((r) => r.id === id) ?? null,
  };
}

describe('Reportes de la app movil (e2e)', () => {
  const ruta = '/api/mobile/v1/reports';
  const cuerpo = { usuarioId: 1, categoria: 'via_en_mal_estado', descripcion: 'Hueco', latitud: 4.65, longitud: -74.08 };
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(REPORTES_REPOSITORY)
      .useValue(crearRepositorioFalso())
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('crea un reporte y responde 201 en camelCase', async () => {
    const respuesta = await request(app.getHttpServer()).post(ruta).send(cuerpo);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toEqual({ id: 1, ...cuerpo, estado: 'recibido', creadoEn: '2026-10-22T18:00:00.000Z' });
  });

  it('responde 400 si falta un dato o sobra uno', async () => {
    const sinCategoria = await request(app.getHttpServer()).post(ruta).send({ usuarioId: 1, latitud: 4.65, longitud: -74.08 });
    const conDatoExtra = await request(app.getHttpServer()).post(ruta).send({ ...cuerpo, extra: 'x' });

    expect(sinCategoria.status).toBe(400);
    expect(conDatoExtra.status).toBe(400);
  });

  it('responde 404 con codigo y mensaje si el ciudadano no existe', async () => {
    const respuesta = await request(app.getHttpServer()).post(ruta).send({ ...cuerpo, usuarioId: 99 });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'No existe el usuario 99' });
  });

  it('lista los reportes y busca uno por id', async () => {
    const lista = await request(app.getHttpServer()).get(ruta);
    const uno = await request(app.getHttpServer()).get(`${ruta}/1`);
    const noExiste = await request(app.getHttpServer()).get(`${ruta}/50`);

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(uno.status).toBe(200);
    expect(noExiste.status).toBe(404);
    expect(noExiste.body.codigo).toBe('REPORTE_NO_ENCONTRADO');
  });
});
