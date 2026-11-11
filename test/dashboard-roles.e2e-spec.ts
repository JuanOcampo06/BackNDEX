import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TABLERO_REPOSITORY, TableroRepositoryPort } from '../src/dashboard/modules/kpis/application/tablero.repository.port';
import { USUARIOS_REPOSITORY, UsuariosRepositoryPort } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { firmarToken } from '../src/platform/auth';
import { tokenDashboard } from './token-dashboard';

// Repositorios falsos para probar los permisos por HTTP sin necesitar PostgreSQL
function crearTableroFalso(): TableroRepositoryPort {
  return {
    listarLocalidades: async () => [{ id: 8, nombre: 'Kennedy' }],
    buscarUltimoMesConDatos: async () => null,
    contarPorSemana: async () => [],
    listarSiniestros: async () => [],
    contarSiniestrosPorLugarYHora: async () => [],
    contarSiniestrosPorMes: async () => [],
    contarVictimasPorSexoYEdad: async () => [],
    contarUsuariosPorTipo: async () => [],
    contarActivacionesPorLugar: async () => [],
    listarReportes: async () => [],
    contarFalsosPositivosPorMotivo: async () => [],
    contarFalsosPositivosPorMes: async () => [],
  };
}

function crearUsuariosFalso(): UsuariosRepositoryPort {
  const admin = {
    id: 1,
    nombreCompleto: 'Admin Demo',
    correo: 'admin@demo.local',
    rol: 'admin' as const,
    creadoEn: '2026-11-01T00:00:00.000Z',
    actualizadoEn: '2026-11-01T00:00:00.000Z',
  };
  return {
    listar: async () => [admin],
    buscarPorId: async (id) => (id === 1 ? admin : null),
    existeCorreo: async () => false,
    crear: async (nuevo) => ({ ...admin, ...nuevo, id: 2 }),
    actualizar: async (_id, cambios) => ({ ...admin, ...cambios }),
    eliminar: async () => true,
  };
}

describe('Permisos del dashboard (e2e)', () => {
  const base = '/api/dashboard/v1';
  const exportar = `${base}/tablero/exportar?kpis=tarjeta_siniestros`;
  const tarjeta = `${base}/tablero/tarjetas/siniestros`;
  const usuarios = `${base}/usuarios`;
  const UNA_SEMANA_Y_UN_DIA_MS = 8 * 24 * 60 * 60 * 1000;
  let app: INestApplication;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TABLERO_REPOSITORY)
      .useValue(crearTableroFalso())
      .overrideProvider(USUARIOS_REPOSITORY)
      .useValue(crearUsuariosFalso())
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const pedir = (url: string, autorizacion?: string) => {
    const peticion = request(app.getHttpServer()).get(url);
    return autorizacion === undefined ? peticion : peticion.set('Authorization', autorizacion);
  };

  it('sin token responde 401 en el tablero la exportacion los usuarios y las ciclovias', async () => {
    const urls = [tarjeta, exportar, usuarios, `${base}/ciclovias?min_lat=4.66&min_lon=-74.06&max_lat=4.68&max_lon=-74.04`];
    const respuestas = await Promise.all(urls.map((url) => pedir(url)));

    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401]);
    expect(respuestas[1].body).toEqual({ codigo: 'TOKEN_INVALIDO', mensaje: 'Falta el token o no es valido' });
  });

  it('con un token invalido vencido o de la app movil responde 401', async () => {
    const vencido = tokenDashboard('admin', Date.now() - UNA_SEMANA_Y_UN_DIA_MS);
    const deLaAppMovil = `Bearer ${firmarToken(1)}`;
    const respuestas = await Promise.all(
      ['Bearer no-es-un-token', 'token-de-prueba', vencido, deLaAppMovil].map((autorizacion) => pedir(exportar, autorizacion)),
    );

    expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401]);
  });

  it('con el rol Usuario puede ver el tablero pero no exportar ni gestionar usuarios', async () => {
    const lector = tokenDashboard('lector');
    const [tablero, excel, lista] = await Promise.all([pedir(tarjeta, lector), pedir(exportar, lector), pedir(usuarios, lector)]);

    expect(tablero.status).toBe(200);
    expect(excel.status).toBe(403);
    expect(excel.body).toEqual({
      codigo: 'ACCESO_DENEGADO',
      mensaje: 'Tu rol no tiene permiso para esta accion: solo el Administrador puede usarla',
    });
    expect(lista.status).toBe(403);
  });

  it('con el rol Administrador exporta y gestiona usuarios igual que antes', async () => {
    const admin = tokenDashboard('admin');
    const [excel, lista] = await Promise.all([pedir(exportar, admin), pedir(usuarios, admin)]);

    expect(excel.status).toBe(200);
    expect(excel.headers['content-type']).toContain('spreadsheetml');
    expect(lista.status).toBe(200);
  });

  it('el token que entrega el login lleva el rol y se respeta en la exportacion', async () => {
    const entrar = (email: string) =>
      request(app.getHttpServer()).post(`${base}/auth/login`).send({ email, password: 'demo1234' });
    const [admin, lector] = await Promise.all([entrar('admin@demo.local'), entrar('lector@demo.local')]);

    expect((await pedir(exportar, `Bearer ${admin.body.access_token}`)).status).toBe(200);
    expect((await pedir(exportar, `Bearer ${lector.body.access_token}`)).status).toBe(403);
  });

  it('un token del dashboard no sirve en la app movil', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/mobile/v1/reports').set('Authorization', tokenDashboard());

    expect(respuesta.status).toBe(401);
  });
});
