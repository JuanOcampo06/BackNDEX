import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { USUARIO_REPOSITORY } from '../src/dashboard/modules/auth/application/usuario.repository.port';
import { USUARIOS_REPOSITORY } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { CIUDADANOS_REPOSITORY } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import type { CiudadanoConClave, CiudadanosRepositoryPort } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import { crearTablaDeUsuariosFalsa } from './dashboard-falsos';

// Ciudadanos en memoria para registrar sin PostgreSQL
function crearCiudadanosFalso(): CiudadanosRepositoryPort {
  const guardados: CiudadanoConClave[] = [];
  return {
    existeCorreo: async (correo) => guardados.some((c) => c.correo === correo),
    crear: async (ciudadano, contrasenaCifrada) => {
      const id = guardados.length + 1;
      guardados.push({ id, ...ciudadano, contrasenaCifrada });
      return { id, ...ciudadano };
    },
    buscarPorCorreo: async (correo) => guardados.find((c) => c.correo === correo) ?? null,
  };
}

const RESPUESTA_429 = { codigo: 'DEMASIADOS_INTENTOS', mensaje: 'Demasiados intentos, espera un momento y vuelve a intentarlo' };

describe('Limite de intentos en login y registro (e2e)', () => {
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
    });

    const estados = await enviarVarias(4, (numero) => post(registroMovil, '203.0.113.4', registro(numero)));

    expect(estados).toEqual([201, 201, 201, 429]);
  });

  it('el login de la app movil responde 429 desde el sexto intento en un minuto', async () => {
    const estados = await enviarVarias(6, () => post(loginMovil, '203.0.113.5', { correo: 'nadie@demo.local', contrasena: 'Incorrecta1' }));

    expect(estados).toEqual([401, 401, 401, 401, 401, 429]);
  });

  it('los endpoints sin limite no se bloquean', async () => {
    const estados = await enviarVarias(10, () => request(app.getHttpServer()).get('/api/health').set('X-Forwarded-For', '203.0.113.6'));

    expect(estados.every((estado) => estado === 200)).toBe(true);
  });
});
