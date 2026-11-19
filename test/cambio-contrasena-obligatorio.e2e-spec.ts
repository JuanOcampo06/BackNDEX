import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { NOTIFICADOR_RESTABLECIMIENTO } from '../src/dashboard/modules/auth/application/notificador-restablecimiento.port';
import { RESTABLECIMIENTOS_REPOSITORY } from '../src/dashboard/modules/auth/application/restablecimientos.repository.port';
import { USUARIO_REPOSITORY } from '../src/dashboard/modules/auth/application/usuario.repository.port';
import { TABLERO_REPOSITORY } from '../src/dashboard/modules/kpis/application/tablero.repository.port';
import { USUARIOS_REPOSITORY } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { LimiteIntentosGuard } from '../src/platform/auth';
import { crearNotificadorFalso, crearRestablecimientosFalsos, crearTablaDeUsuariosFalsa, crearTableroFalso } from './dashboard-falsos';

const base = '/api/dashboard/v1';
const tarjeta = `${base}/tablero/tarjetas/siniestros`;
const CAMBIO_REQUERIDO = { codigo: 'CAMBIO_CONTRASENA_REQUERIDO', mensaje: 'Debes cambiar tu contraseña antes de continuar' };

// Arma la api completa con la tabla de usuarios en memoria
async function crearApp(conUsuariosDePrueba = true, notificador = crearNotificadorFalso()): Promise<INestApplication> {
  const tabla = await crearTablaDeUsuariosFalsa(conUsuariosDePrueba);
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(USUARIOS_REPOSITORY)
    .useValue(tabla.usuarios)
    .overrideProvider(USUARIO_REPOSITORY)
    .useValue(tabla.cuentas)
    .overrideProvider(RESTABLECIMIENTOS_REPOSITORY)
    .useValue(crearRestablecimientosFalsos())
    .overrideProvider(NOTIFICADOR_RESTABLECIMIENTO)
    .useValue(notificador)
    .overrideProvider(TABLERO_REPOSITORY)
    .useValue(crearTableroFalso())
    // Estas pruebas inician sesion muchas veces y el limite se prueba en limite-intentos.e2e-spec.ts
    .overrideGuard(LimiteIntentosGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = modulo.createNestApplication();
  app.setGlobalPrefix('api');
  await app.init();
  return app;
}

describe('Cambio de contrasena obligatorio (e2e)', () => {
  const notificador = crearNotificadorFalso();
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp(true, notificador);
  });

  afterAll(async () => {
    await app.close();
  });

  const http = () => request(app.getHttpServer());
  const entrar = (email: string, password: string) => http().post(`${base}/auth/login`).send({ email, password });
  const tokenDe = async (email: string, password: string) => `Bearer ${(await entrar(email, password)).body.access_token}`;
  // El token se pide antes de armar la peticion porque supertest no deja dos peticiones a medias en el mismo servidor
  const crearUsuario = async (correo: string, contrasena: string): Promise<number> => {
    const admin = await tokenDe('admin@demo.local', 'demo1234');
    const respuesta = await http().post(`${base}/usuarios`).set('Authorization', admin).send({ nombre_completo: 'Persona Nueva', correo, rol: 'lector', contrasena });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.debe_cambiar_contrasena).toBe(true);
    return respuesta.body.id;
  };

  it('un usuario creado por el admin solo ve su perfil y cambia la contrasena hasta que la cambia', async () => {
    await crearUsuario('nueva@demo.local', 'Clave-del-admin1');
    const login = await entrar('nueva@demo.local', 'Clave-del-admin1');
    const token = `Bearer ${login.body.access_token}`;

    expect(login.status).toBe(200);
    expect(login.body.user.debe_cambiar_contrasena).toBe(true);

    const bloqueado = await http().get(tarjeta).set('Authorization', token);
    const editarPerfil = await http().patch(`${base}/auth/me`).set('Authorization', token).send({ full_name: 'Otro Nombre' });
    const perfil = await http().get(`${base}/auth/me`).set('Authorization', token);
    expect(bloqueado.status).toBe(403);
    expect(bloqueado.body).toEqual(CAMBIO_REQUERIDO);
    expect(editarPerfil.status).toBe(403);
    expect(perfil.status).toBe(200);
    expect(perfil.body.debe_cambiar_contrasena).toBe(true);

    const cambio = await http()
      .patch(`${base}/auth/me/contrasena`)
      .set('Authorization', token)
      .send({ contrasena_actual: 'Clave-del-admin1', contrasena_nueva: 'Clave-propia1' });
    expect(cambio.status).toBe(204);

    // El mismo token ya sirve sin volver a iniciar sesion
    expect((await http().get(tarjeta).set('Authorization', token)).status).toBe(200);
    expect((await entrar('nueva@demo.local', 'Clave-propia1')).body.user.debe_cambiar_contrasena).toBe(false);
  });

  it('restablecer la contrasena con el enlace del correo tambien quita la marca', async () => {
    await crearUsuario('olvido@demo.local', 'Clave-del-admin1');
    await http().post(`${base}/auth/restablecer-contrasena/solicitar`).send({ email: 'olvido@demo.local' });
    const { token } = notificador.avisos[notificador.avisos.length - 1];

    const confirmado = await http().post(`${base}/auth/restablecer-contrasena/confirmar`).send({ token, password: 'Clave-elegida1' });

    expect(confirmado.status).toBe(204);
    const login = await entrar('olvido@demo.local', 'Clave-elegida1');
    expect(login.body.user.debe_cambiar_contrasena).toBe(false);
    expect((await http().get(tarjeta).set('Authorization', `Bearer ${login.body.access_token}`)).status).toBe(200);
  });

  // Va al final porque le cambia la contrasena al admin que usan las otras pruebas
  it('cuando el admin le pone una contrasena nueva a otro usuario ese usuario debe cambiarla y a si mismo no', async () => {
    const admin = await tokenDe('admin@demo.local', 'demo1234');
    const aOtro = await http().patch(`${base}/usuarios/2`).set('Authorization', admin).send({ contrasena: 'Clave-temporal1' });
    const aSiMismo = await http().patch(`${base}/usuarios/1`).set('Authorization', admin).send({ contrasena: 'Clave-del-admin2' });

    expect(aOtro.body.debe_cambiar_contrasena).toBe(true);
    expect(aSiMismo.body.debe_cambiar_contrasena).toBe(false);
    const lector = await tokenDe('lector@demo.local', 'Clave-temporal1');
    expect((await http().get(tarjeta).set('Authorization', lector)).status).toBe(403);
    const adminConSuClave = await tokenDe('admin@demo.local', 'Clave-del-admin2');
    expect((await http().get(tarjeta).set('Authorization', adminConSuClave)).status).toBe(200);
  });
});

describe('Administrador inicial desde ADMIN_CORREO y ADMIN_CONTRASENA (e2e)', () => {
  const variablesOriginales = { correo: process.env.ADMIN_CORREO, contrasena: process.env.ADMIN_CONTRASENA };

  const definirVariables = (correo?: string, contrasena?: string) => {
    for (const [nombre, valor] of [['ADMIN_CORREO', correo], ['ADMIN_CONTRASENA', contrasena]] as const) {
      if (valor === undefined) delete process.env[nombre];
      else process.env[nombre] = valor;
    }
  };

  afterEach(() => {
    definirVariables(variablesOriginales.correo, variablesOriginales.contrasena);
  });

  it('con la base vacia crea el administrador y en su primer ingreso debe cambiar la contrasena', async () => {
    definirVariables('Jefe@Entidad.gov.co', 'Clave-inicial1');
    const app = await crearApp(false);
    try {
      const login = await request(app.getHttpServer()).post(`${base}/auth/login`).send({ email: 'jefe@entidad.gov.co', password: 'Clave-inicial1' });

      expect(login.status).toBe(200);
      expect(login.body.user).toMatchObject({ email: 'jefe@entidad.gov.co', role: 'admin', debe_cambiar_contrasena: true });
      const lista = await request(app.getHttpServer()).get(`${base}/usuarios`).set('Authorization', `Bearer ${login.body.access_token}`);
      expect(lista.body).toEqual(CAMBIO_REQUERIDO);
    } finally {
      await app.close();
    }
  });

  it('si ya hay un administrador no crea otro', async () => {
    definirVariables('otro.admin@entidad.gov.co', 'Clave-inicial1');
    const app = await crearApp(true);
    try {
      const login = await request(app.getHttpServer()).post(`${base}/auth/login`).send({ email: 'otro.admin@entidad.gov.co', password: 'Clave-inicial1' });

      expect(login.status).toBe(401);
    } finally {
      await app.close();
    }
  });

  it('la api no arranca si la contrasena no cumple las reglas o falta una de las dos variables', async () => {
    definirVariables('jefe@entidad.gov.co', 'debil');
    await expect(crearApp(false)).rejects.toThrow('ADMIN_CORREO o ADMIN_CONTRASENA no son validos');

    definirVariables('jefe@entidad.gov.co', undefined);
    await expect(crearApp(false)).rejects.toThrow('se necesitan el correo y la contraseña');
  });
});
