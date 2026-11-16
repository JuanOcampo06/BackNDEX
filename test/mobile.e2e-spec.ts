import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { firmarToken } from '../src/platform/auth';
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
  const cuerpo = { categoria: 'danos_en_la_via', subcategoria: 'hueco', tipoVehiculo: 'bicicleta', descripcion: 'Hueco', latitud: 4.65, longitud: -74.08 };
  let app: INestApplication;
  // El ciudadano 1 es el dueno de los reportes de estas pruebas
  const autorizacion = (usuarioId = 1): string => `Bearer ${firmarToken(usuarioId)}`;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
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
    const respuesta = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send(cuerpo);

    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toEqual({ id: 1, usuarioId: 1, ...cuerpo, estado: 'recibido', creadoEn: '2026-10-22T18:00:00.000Z' });
  });

  it('responde 400 si falta un dato o sobra uno', async () => {
    const sinCategoria = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send({ latitud: 4.65, longitud: -74.08 });
    const conDatoExtra = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send({ ...cuerpo, extra: 'x' });
    // El ciudadano sale del token y ya no se puede mandar en el cuerpo
    const conUsuarioEnElCuerpo = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send({ ...cuerpo, usuarioId: 2 });

    expect(sinCategoria.status).toBe(400);
    expect(conDatoExtra.status).toBe(400);
    expect(conUsuarioEnElCuerpo.status).toBe(400);
  });

  it('responde 400 si falta la subcategoria o no es de la categoria elegida', async () => {
    const faltante = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send({ ...cuerpo, subcategoria: undefined });
    const deOtraCategoria = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion()).send({ ...cuerpo, categoria: 'seguridad' });

    expect(faltante.status).toBe(400);
    expect(deOtraCategoria.status).toBe(400);
  });

  it('responde 404 con codigo y mensaje si el ciudadano no existe', async () => {
    const respuesta = await request(app.getHttpServer()).post(ruta).set('Authorization', autorizacion(99)).send(cuerpo);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body).toEqual({ codigo: 'USUARIO_NO_ENCONTRADO', mensaje: 'No existe el usuario 99' });
  });

  it('lista los reportes y busca uno por id', async () => {
    const lista = await request(app.getHttpServer()).get(ruta).set('Authorization', autorizacion());
    const uno = await request(app.getHttpServer()).get(`${ruta}/1`).set('Authorization', autorizacion());
    const noExiste = await request(app.getHttpServer()).get(`${ruta}/50`).set('Authorization', autorizacion());
    const deOtroCiudadano = await request(app.getHttpServer()).get(`${ruta}/1`).set('Authorization', autorizacion(2));

    expect(lista.status).toBe(200);
    expect(lista.body).toHaveLength(1);
    expect(uno.status).toBe(200);
    expect(noExiste.status).toBe(404);
    expect(noExiste.body.codigo).toBe('REPORTE_NO_ENCONTRADO');
    expect(deOtroCiudadano.status).toBe(404);
  });

  it('responde 401 sin token y con un token que no es valido', async () => {
    const sinToken = await request(app.getHttpServer()).get(ruta);
    const tokenFalso = await request(app.getHttpServer()).get(ruta).set('Authorization', 'Bearer abc.def.ghi');

    expect(sinToken.status).toBe(401);
    expect(sinToken.body).toMatchObject({ codigo: 'TOKEN_INVALIDO' });
    expect(tokenFalso.status).toBe(401);
  });
});
