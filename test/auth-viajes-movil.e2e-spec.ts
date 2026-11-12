import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { CIUDADANOS_REPOSITORY } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import type { CiudadanoConClave, CiudadanosRepositoryPort } from '../src/mobile/modules/auth/application/ciudadanos.repository.port';
import { VIAJES_REPOSITORY } from '../src/mobile/modules/trips/application/viajes.repository.port';
import type { ViajesRepositoryPort } from '../src/mobile/modules/trips/application/viajes.repository.port';
import type { Viaje, ViajeConPuntos } from '../src/mobile/modules/trips/domain/viaje';

const FECHA = '2026-10-22T18:00:00.000Z';

// Repositorios falsos en memoria para probar la puerta HTTP sin necesitar PostgreSQL
// el cifrado de la contrasena y el JWT si son los reales
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

function crearViajesFalso(): ViajesRepositoryPort {
  const viajes: ViajeConPuntos[] = [];
  const sinPuntos = (v: ViajeConPuntos): Viaje => ({
    id: v.id,
    usuarioId: v.usuarioId,
    estado: v.estado,
    distanciaM: v.distanciaM,
    iniciadoEn: v.iniciadoEn,
    finalizadoEn: v.finalizadoEn,
  });
  return {
    buscarEnCurso: async (usuarioId) => {
      const viaje = viajes.find((v) => v.usuarioId === usuarioId && v.estado === 'en_curso');
      return viaje === undefined ? null : sinPuntos(viaje);
    },
    iniciar: async (nuevo) => {
      const viaje: ViajeConPuntos = {
        id: viajes.length + 1,
        usuarioId: nuevo.usuarioId,
        estado: 'en_curso',
        distanciaM: 0,
        iniciadoEn: FECHA,
        finalizadoEn: null,
        puntos: [{ latitud: nuevo.latitud, longitud: nuevo.longitud, registradoEn: FECHA }],
      };
      viajes.push(viaje);
      return sinPuntos(viaje);
    },
    buscarPorId: async (id) => viajes.find((v) => v.id === id) ?? null,
    agregarPunto: async (viajeId, ubicacion) => {
      const punto = { ...ubicacion, registradoEn: FECHA };
      (viajes.find((v) => v.id === viajeId) as ViajeConPuntos).puntos.push(punto);
      return punto;
    },
    finalizar: async (id, distanciaM) => {
      const viaje = viajes.find((v) => v.id === id) as ViajeConPuntos;
      Object.assign(viaje, { estado: 'finalizado', distanciaM, finalizadoEn: FECHA });
      return sinPuntos(viaje);
    },
    listar: async (usuarioId) => viajes.filter((v) => v.usuarioId === usuarioId).map(sinPuntos),
  };
}

describe('Registro, login y viajes de la app movil (e2e)', () => {
  const base = '/api/mobile/v1';
  const registro = {
    nombreCompleto: 'Ana Lopez',
    correo: 'ana@demo.local',
    contrasena: 'clave-segura-1',
    fechaNacimiento: '1995-04-23',
    genero: 'femenino',
  };
  let app: INestApplication;

  const http = () => request(app.getHttpServer());
  const registrarYObtenerToken = async (correo: string): Promise<string> => {
    const respuesta = await http().post(`${base}/auth/register`).send({ ...registro, correo });
    return `Bearer ${respuesta.body.accessToken}`;
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(CIUDADANOS_REPOSITORY)
      .useValue(crearCiudadanosFalso())
      .overrideProvider(VIAJES_REPOSITORY)
      .useValue(crearViajesFalso())
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('auth', () => {
    it('registra al ciudadano, responde 201 con el token y no devuelve la contrasena', async () => {
      const respuesta = await http().post(`${base}/auth/register`).send(registro);

      expect(respuesta.status).toBe(201);
      expect(respuesta.body.accessToken.split('.')).toHaveLength(3);
      expect(respuesta.body.ciudadano).toEqual({
        id: 1,
        nombreCompleto: 'Ana Lopez',
        correo: 'ana@demo.local',
        telefono: null,
        fechaNacimiento: '1995-04-23',
        genero: 'femenino',
      });
    });

    it('responde 409 si el correo ya esta registrado y 400 si los datos son invalidos', async () => {
      const repetido = await http().post(`${base}/auth/register`).send(registro);
      const claveCorta = await http().post(`${base}/auth/register`).send({ ...registro, correo: 'otra@demo.local', contrasena: 'corta' });
      const telefonoMalo = await http().post(`${base}/auth/register`).send({ ...registro, correo: 'otra@demo.local', telefono: 'abc' });

      expect(repetido.status).toBe(409);
      expect(repetido.body.codigo).toBe('CORREO_DUPLICADO');
      expect(claveCorta.status).toBe(400);
      expect(telefonoMalo.status).toBe(400);
      expect(telefonoMalo.body.codigo).toBe('CIUDADANO_INVALIDO');
    });

    it('exige la fecha de nacimiento y el genero y rechaza a un menor de edad', async () => {
      const otro = { ...registro, correo: 'otra@demo.local' };
      const sin = (campo: string) => Object.fromEntries(Object.entries(otro).filter(([nombre]) => nombre !== campo));
      const sinFecha = sin('fechaNacimiento');
      const sinGenero = sin('genero');
      const respuestas = await Promise.all([
        http().post(`${base}/auth/register`).send(sinFecha),
        http().post(`${base}/auth/register`).send(sinGenero),
        http().post(`${base}/auth/register`).send({ ...otro, genero: 'Femenino' }),
        http().post(`${base}/auth/register`).send({ ...otro, fechaNacimiento: '23/04/1995' }),
        http().post(`${base}/auth/register`).send({ ...otro, fechaNacimiento: '2000-02-30' }),
        http().post(`${base}/auth/register`).send({ ...otro, fechaNacimiento: '2999-01-01' }),
      ]);
      const menor = await http().post(`${base}/auth/register`).send({ ...otro, fechaNacimiento: new Date().getUTCFullYear() - 10 + '-01-01' });

      expect(respuestas.map((r) => r.status)).toEqual([400, 400, 400, 400, 400, 400]);
      expect(menor.status).toBe(400);
      expect(menor.body.codigo).toBe('CIUDADANO_INVALIDO');
      expect(menor.body.mensaje).toContain('mayor de edad');
    });

    it('inicia sesion con la contrasena correcta y responde 200 con un token que sirve', async () => {
      const login = await http().post(`${base}/auth/login`).send({ correo: 'ANA@demo.local', contrasena: registro.contrasena });
      const conToken = await http().get(`${base}/trips`).set('Authorization', `Bearer ${login.body.accessToken}`);

      expect(login.status).toBe(200);
      expect(login.body.ciudadano.id).toBe(1);
      expect(conToken.status).toBe(200);
    });

    it('responde 401 si la contrasena o el correo no coinciden', async () => {
      const claveMala = await http().post(`${base}/auth/login`).send({ correo: registro.correo, contrasena: 'otra-clave-1' });
      const correoMalo = await http().post(`${base}/auth/login`).send({ correo: 'nadie@demo.local', contrasena: registro.contrasena });

      expect(claveMala.status).toBe(401);
      expect(claveMala.body).toEqual({ codigo: 'CREDENCIALES_INVALIDAS', mensaje: 'Correo o contrasena incorrectos' });
      expect(correoMalo.status).toBe(401);
    });
  });

  describe('trips', () => {
    it('pide token en todas las rutas', async () => {
      const respuestas = await Promise.all([
        http().post(`${base}/trips`).send({ latitud: 4.65, longitud: -74.08 }),
        http().get(`${base}/trips`),
        http().get(`${base}/trips/1`),
        http().post(`${base}/trips/1/puntos`).send({ latitud: 4.65, longitud: -74.08 }),
        http().patch(`${base}/trips/1/finalizar`),
      ]);

      expect(respuestas.map((r) => r.status)).toEqual([401, 401, 401, 401, 401]);
    });

    it('recorre el viaje completo: iniciar, agregar punto, ver y finalizar', async () => {
      const token = await registrarYObtenerToken('ciclista@demo.local');

      const inicio = await http().post(`${base}/trips`).set('Authorization', token).send({ latitud: 4, longitud: -74 });
      const punto = await http().post(`${base}/trips/${inicio.body.id}/puntos`).set('Authorization', token).send({ latitud: 5, longitud: -74 });
      const detalle = await http().get(`${base}/trips/${inicio.body.id}`).set('Authorization', token);
      const fin = await http().patch(`${base}/trips/${inicio.body.id}/finalizar`).set('Authorization', token);
      const otraVez = await http().patch(`${base}/trips/${inicio.body.id}/finalizar`).set('Authorization', token);

      expect(inicio.status).toBe(201);
      expect(inicio.body).toMatchObject({ estado: 'en_curso', distanciaM: 0, finalizadoEn: null });
      expect(punto.status).toBe(201);
      expect(detalle.body.puntos).toHaveLength(2);
      expect(fin.status).toBe(200);
      expect(fin.body.estado).toBe('finalizado');
      expect(fin.body.distanciaM).toBeGreaterThan(111_000);
      expect(otraVez.status).toBe(400);
      expect(otraVez.body.codigo).toBe('VIAJE_INVALIDO');
    });

    it('responde 409 si ya hay un viaje en curso y 400 con una ubicacion invalida', async () => {
      const token = await registrarYObtenerToken('doble@demo.local');
      await http().post(`${base}/trips`).set('Authorization', token).send({ latitud: 4.65, longitud: -74.08 });

      const segundo = await http().post(`${base}/trips`).set('Authorization', token).send({ latitud: 4.65, longitud: -74.08 });
      const invalida = await http().post(`${base}/trips`).set('Authorization', token).send({ latitud: 95, longitud: -74.08 });

      expect(segundo.status).toBe(409);
      expect(segundo.body.codigo).toBe('VIAJE_EN_CURSO_DUPLICADO');
      expect(invalida.status).toBe(400);
    });

    it('un ciudadano no ve ni toca los viajes de otro', async () => {
      const dueno = await registrarYObtenerToken('dueno@demo.local');
      const intruso = await registrarYObtenerToken('intruso@demo.local');
      const viaje = await http().post(`${base}/trips`).set('Authorization', dueno).send({ latitud: 4.65, longitud: -74.08 });

      const ver = await http().get(`${base}/trips/${viaje.body.id}`).set('Authorization', intruso);
      const punto = await http().post(`${base}/trips/${viaje.body.id}/puntos`).set('Authorization', intruso).send({ latitud: 4.65, longitud: -74.08 });
      const cerrar = await http().patch(`${base}/trips/${viaje.body.id}/finalizar`).set('Authorization', intruso);
      const lista = await http().get(`${base}/trips`).set('Authorization', intruso);

      expect([ver.status, punto.status, cerrar.status]).toEqual([404, 404, 404]);
      expect(ver.body.codigo).toBe('VIAJE_NO_ENCONTRADO');
      expect(lista.body).toEqual([]);
    });
  });
});
