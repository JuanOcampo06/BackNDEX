import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NOTIFICADOR_RESTABLECIMIENTO } from '../src/dashboard/modules/auth/application/notificador-restablecimiento.port';
import { RESTABLECIMIENTOS_REPOSITORY } from '../src/dashboard/modules/auth/application/restablecimientos.repository.port';
import { USUARIO_REPOSITORY } from '../src/dashboard/modules/auth/application/usuario.repository.port';
import { TABLERO_REPOSITORY } from '../src/dashboard/modules/kpis/application/tablero.repository.port';
import { USUARIOS_REPOSITORY } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { crearNotificadorFalso, crearRestablecimientosFalsos, crearTablaDeUsuariosFalsa, crearTableroFalso } from './dashboard-falsos';

describe('Login perfil y contrasena del dashboard (e2e)', () => {
  const base = '/api/dashboard/v1';
  const notificador = crearNotificadorFalso();
  let app: INestApplication;

  beforeAll(async () => {
    const usuarios = await crearTablaDeUsuariosFalsa();
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(USUARIOS_REPOSITORY)
      .useValue(usuarios)
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(usuarios)
      .overrideProvider(RESTABLECIMIENTOS_REPOSITORY)
      .useValue(crearRestablecimientosFalsos())
      .overrideProvider(NOTIFICADOR_RESTABLECIMIENTO)
      .useValue(notificador)
      .overrideProvider(TABLERO_REPOSITORY)
      .useValue(crearTableroFalso())
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const entrar = (email: string, password: string) => request(app.getHttpServer()).post(`${base}/auth/login`).send({ email, password });
  const tokenDe = async (email: string, password = 'demo1234') => `Bearer ${(await entrar(email, password)).body.access_token}`;

  it('responde 200 con el token JWT y el usuario en snake_case desde la tabla de usuarios', async () => {
    const respuesta = await entrar('admin@demo.local', 'demo1234');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({
      access_token: expect.stringMatching(/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/),
      user: { id: '1', full_name: 'Admin Demo', email: 'admin@demo.local', role: 'admin' },
    });
  });

  it('responde 401 con un mensaje generico si la contrasena es incorrecta o el correo no existe', async () => {
    const [errada, inexistente] = await Promise.all([entrar('admin@demo.local', 'incorrecta'), entrar('nadie@demo.local', 'demo1234')]);

    expect(errada.status).toBe(401);
    expect(errada.body).toEqual({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Correo o contraseña incorrectos' });
    expect(inexistente.status).toBe(401);
  });

  it('un usuario creado desde el tablero con contrasena puede iniciar sesion y sin contrasena no', async () => {
    const admin = await tokenDe('admin@demo.local');
    const crear = (correo: string, extra: object) =>
      request(app.getHttpServer())
        .post(`${base}/usuarios`)
        .set('Authorization', admin)
        .send({ nombre_completo: 'Nuevo', correo, rol: 'lector', ...extra });

    const conClave = await crear('nuevo@demo.local', { contrasena: 'clave-nueva-1', entidad: 'Alcaldía' });
    const sinClave = await crear('sin.clave@demo.local', {});

    expect(conClave.status).toBe(201);
    expect(conClave.body).toMatchObject({ correo: 'nuevo@demo.local', entidad: 'Alcaldía' });
    expect(conClave.body).not.toHaveProperty('contrasena');
    expect(conClave.body).not.toHaveProperty('contrasena_cifrada');
    expect((await entrar('nuevo@demo.local', 'clave-nueva-1')).body.user).toMatchObject({ email: 'nuevo@demo.local', role: 'lector' });
    expect(sinClave.status).toBe(201);
    expect((await entrar('sin.clave@demo.local', 'cualquiera')).status).toBe(401);
  });

  it('GET /auth/me devuelve el perfil del dueno del token y sin token responde 401', async () => {
    const lector = await tokenDe('lector@demo.local');
    const [perfil, sinToken] = await Promise.all([
      request(app.getHttpServer()).get(`${base}/auth/me`).set('Authorization', lector),
      request(app.getHttpServer()).get(`${base}/auth/me`),
    ]);

    expect(perfil.status).toBe(200);
    expect(perfil.body).toEqual({ id: '2', full_name: 'Lector Demo', email: 'lector@demo.local', role: 'lector', entidad: null });
    expect(sinToken.status).toBe(401);
  });

  it('PATCH /auth/me cambia nombre y entidad y no deja cambiar el propio rol', async () => {
    const lector = await tokenDe('lector@demo.local');
    const cambiar = (cuerpo: object) => request(app.getHttpServer()).patch(`${base}/auth/me`).set('Authorization', lector).send(cuerpo);

    const cambio = await cambiar({ full_name: 'Lectora Editada', entidad: 'Secretaría Distrital de Movilidad' });
    const conRol = await cambiar({ role: 'admin' });
    const correoAjeno = await cambiar({ email: 'admin@demo.local' });

    expect(cambio.status).toBe(200);
    expect(cambio.body).toEqual({
      id: '2',
      full_name: 'Lectora Editada',
      email: 'lector@demo.local',
      role: 'lector',
      entidad: 'Secretaría Distrital de Movilidad',
    });
    expect(conRol.status).toBe(400);
    expect(correoAjeno.status).toBe(409);
    const releido = await request(app.getHttpServer()).get(`${base}/auth/me`).set('Authorization', lector);
    expect(releido.body.full_name).toBe('Lectora Editada');
  });

  it('restablece la contrasena con el enlace y el enlace no sirve dos veces', async () => {
    const solicitar = (email: string) => request(app.getHttpServer()).post(`${base}/auth/restablecer-contrasena/solicitar`).send({ email });
    const confirmar = (token: string, password: string) =>
      request(app.getHttpServer()).post(`${base}/auth/restablecer-contrasena/confirmar`).send({ token, password });

    const pedido = await solicitar('admin@demo.local');
    const inexistente = await solicitar('nadie@demo.local');
    expect(pedido.status).toBe(202);
    expect(inexistente.status).toBe(202);
    expect(inexistente.body).toEqual(pedido.body);
    expect(notificador.avisos).toHaveLength(1);

    const token = notificador.avisos[0].token;
    expect((await confirmar(token, 'corta')).status).toBe(400);
    expect((await confirmar(token, 'clave-restablecida')).status).toBe(204);
    expect((await confirmar(token, 'otra-clave-mas')).body).toMatchObject({ codigo: 'RESTABLECIMIENTO_INVALIDO' });
    expect((await entrar('admin@demo.local', 'clave-restablecida')).status).toBe(200);
    expect((await entrar('admin@demo.local', 'demo1234')).status).toBe(401);
  });

  it('el tablero entrega los creditos de las fuentes y el rango de meses con datos', async () => {
    const lector = await tokenDe('lector@demo.local');
    const [creditos, filtros] = await Promise.all([
      request(app.getHttpServer()).get(`${base}/tablero/creditos`).set('Authorization', lector),
      request(app.getHttpServer()).get(`${base}/tablero/filtros`).set('Authorization', lector),
    ]);

    expect(creditos.status).toBe(200);
    expect(creditos.body.fuentes[0]).toEqual({
      fuente: 'anuario',
      nombre: 'Anuario de Siniestralidad Vial de Bogotá',
      entidad: 'Secretaría Distrital de Movilidad',
      enlace: 'https://datosabiertos.bogota.gov.co/dataset/anuario-siniestralidad',
      licencia: 'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)',
      enlace_licencia: 'https://creativecommons.org/licenses/by-sa/4.0/deed.es',
      fecha_corte: '2025-12-31',
    });
    expect(creditos.body.fuentes[1]).toMatchObject({ fuente: 'ciclovias', fecha_corte: '2026-10-22' });
    expect(filtros.body).toMatchObject({ primer_mes: '2025-01', ultimo_mes: '2025-12', fuentes: ['anuario', 'app'] });
  });
});
