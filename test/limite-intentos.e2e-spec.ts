import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { USUARIO_REPOSITORY } from '../src/dashboard/modules/auth/application/usuario.repository.port';
import { USUARIOS_REPOSITORY } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { NOTIFICADOR_RESTABLECIMIENTO } from '../src/dashboard/modules/auth/application/notificador-restablecimiento.port';
import { RESTABLECIMIENTOS_REPOSITORY as RESTABLECIMIENTOS_DASHBOARD } from '../src/dashboard/modules/auth/application/restablecimientos.repository.port';
import { CIUDADANOS_REPOSITORY } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import type { CiudadanoConClave, CiudadanosRepositoryPort } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import { RESTABLECIMIENTOS_REPOSITORY as RESTABLECIMIENTOS_MOVIL, VERIFICACIONES_REPOSITORY } from '../src/mobile/modules/auth/application/codigos.repository.port';
import type { CodigosRepositoryPort } from '../src/mobile/modules/auth/application/codigos.repository.port';
import { NOTIFICADOR_CODIGOS } from '../src/mobile/modules/auth/application/notificador-codigos.port';
import { crearNotificadorFalso, crearRestablecimientosFalsos, crearTablaDeUsuariosFalsa } from './dashboard-falsos';

// Ciudadanos en memoria para registrar sin PostgreSQL
function crearCiudadanosFalso(): CiudadanosRepositoryPort {
  const guardados: CiudadanoConClave[] = [];
  return {
    existeCorreo: async (correo) => guardados.some((c) => c.correo === correo),
    crear: async (ciudadano, contrasenaCifrada) => {
      const id = guardados.length + 1;
      guardados.push({ id, ...ciudadano, contrasenaCifrada, correoVerificado: false });
      return { id, ...ciudadano };
    },
    buscarPorCorreo: async (correo) => guardados.find((c) => c.correo === correo) ?? null,
    cambiarContrasena: async () => undefined,
    marcarCorreoVerificado: async () => undefined,
  };
}

// Codigos en memoria que nunca sirven porque aqui solo se cuenta cuantas veces se intenta
function crearCodigosFalso(): CodigosRepositoryPort {
  return {
    crear: async () => '123456',
    haySolicitudDesde: async () => false,
    consumir: async () => false,
  };
}

const RESPUESTA_429 = { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos, espera un momento y vuelve a intentarlo' };

describe('Limite de intentos en login registro y codigos del correo (e2e)', () => {
  const loginDashboard = '/api/dashboard/v1/auth/login';
  const loginMovil = '/api/mobile/v1/auth/login';
  const registroMovil = '/api/mobile/v1/auth/register';
  let app: NestExpressApplication;

  beforeAll(async () => {
    const tabla = await crearTablaDeUsuariosFalsa();
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(USUARIOS_REPOSITORY)
      .useValue(tabla.usuarios)
      .overrideProvider(USUARIO_REPOSITORY)
      .useValue(tabla.cuentas)
      .overrideProvider(CIUDADANOS_REPOSITORY)
      .useValue(crearCiudadanosFalso())
      .overrideProvider(VERIFICACIONES_REPOSITORY)
      .useValue(crearCodigosFalso())
      .overrideProvider(RESTABLECIMIENTOS_MOVIL)
      .useValue(crearCodigosFalso())
      .overrideProvider(NOTIFICADOR_CODIGOS)
      .useValue({ enviarRestablecimiento: async () => undefined, enviarVerificacion: async () => undefined })
      .overrideProvider(RESTABLECIMIENTOS_DASHBOARD)
      .useValue(crearRestablecimientosFalsos())
      .overrideProvider(NOTIFICADOR_RESTABLECIMIENTO)
      .useValue(crearNotificadorFalso())
      .compile();
    app = modulo.createNestApplication<NestExpressApplication>();
    // Igual que en main.ts asi cada prueba usa su propia IP con X-Forwarded-For y no comparte contadores
    app.set('trust proxy', 1);
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Peticiones en orden para que el conteo sea exacto
  const enviarVarias = async (veces: number, enviar: (numero: number) => Promise<request.Response>): Promise<number[]> => {
    const estados: number[] = [];
    for (let numero = 1; numero <= veces; numero++) {
      estados.push((await enviar(numero)).status);
    }
    return estados;
  };

  const post = (url: string, ip: string, cuerpo: object) =>
    request(app.getHttpServer()).post(url).set('X-Forwarded-For', ip).send(cuerpo);

  it('el login del dashboard responde 429 desde el sexto intento en un minuto aunque la contrasena sea la correcta', async () => {
    const ip = '203.0.113.1';
    const errados = await enviarVarias(5, () => post(loginDashboard, ip, { email: 'admin@demo.local', password: 'Incorrecta1' }));
    const conLaCorrecta = await post(loginDashboard, ip, { email: 'admin@demo.local', password: 'demo1234' });

    expect(errados).toEqual([401, 401, 401, 401, 401]);
    expect(conLaCorrecta.status).toBe(429);
    expect(conLaCorrecta.body).toEqual(RESPUESTA_429);
  });

  it('el limite es por IP y otra IP todavia puede iniciar sesion', async () => {
    await enviarVarias(6, () => post(loginDashboard, '203.0.113.2', { email: 'admin@demo.local', password: 'Incorrecta1' }));

    const otraIp = await post(loginDashboard, '203.0.113.3', { email: 'admin@demo.local', password: 'demo1234' });

    expect(otraIp.status).toBe(200);
  });

  it('el registro de la app movil responde 429 desde el cuarto registro en una hora', async () => {
    const registro = (numero: number) => ({
      nombreCompleto: 'Ana Lopez',
      correo: `ana${numero}@demo.local`,
      contrasena: 'clave-segura-1',
      fechaNacimiento: '1995-04-23',
      genero: 'femenino',
      aceptaTerminos: true,
    });

    const estados = await enviarVarias(4, (numero) => post(registroMovil, '203.0.113.4', registro(numero)));

    expect(estados).toEqual([201, 201, 201, 429]);
  });

  it('el login de la app movil responde 429 desde el sexto intento en un minuto', async () => {
    const estados = await enviarVarias(6, () => post(loginMovil, '203.0.113.5', { correo: 'nadie@demo.local', contrasena: 'Incorrecta1' }));

    expect(estados).toEqual([401, 401, 401, 401, 401, 429]);
  });

  // Envian o revisan un codigo del correo y llevan el mismo limite que el login
  const conCodigo: [string, object][] = [
    ['/api/mobile/v1/auth/verify-email', { correo: 'nadie@demo.local', codigo: '000000' }],
    ['/api/mobile/v1/auth/resend-code', { correo: 'nadie@demo.local' }],
    ['/api/mobile/v1/auth/forgot-password', { correo: 'nadie@demo.local' }],
    ['/api/mobile/v1/auth/reset-password', { correo: 'nadie@demo.local', codigo: '000000', contrasenaNueva: 'Clave-segura1' }],
    ['/api/dashboard/v1/auth/restablecer-contrasena/solicitar', { email: 'nadie@demo.local' }],
    ['/api/dashboard/v1/auth/restablecer-contrasena/confirmar', { token: 'token-que-no-existe', password: 'Clave-segura1' }],
  ];

  it.each(conCodigo.map(([url, cuerpo], numero) => [url, cuerpo, `203.0.113.${20 + numero}`] as const))(
    '%s responde 429 desde el sexto intento en un minuto',
    async (url, cuerpo, ip) => {
      const estados = await enviarVarias(6, () => post(url, ip, cuerpo));

      expect(estados.slice(0, 5).every((estado) => estado !== 429)).toBe(true);
      expect(estados[5]).toBe(429);
    },
  );

  it('los endpoints sin limite no se bloquean', async () => {
    const estados = await enviarVarias(10, () => request(app.getHttpServer()).get('/api/health').set('X-Forwarded-For', '203.0.113.6'));

    expect(estados.every((estado) => estado === 200)).toBe(true);
  });
});
