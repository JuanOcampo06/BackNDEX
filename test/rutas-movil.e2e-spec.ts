import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { RED_CICLOVIAS_REPOSITORY } from '../src/mobile/modules/routes/application/red-ciclovias.repository.port';
import type { ViaCiclista } from '../src/mobile/modules/routes/domain/via-ciclista';
import { firmarToken } from '../src/platform/auth';

// Triangulo de ciclovias: de A a B por la via directa son unos 1.100 metros y por C unos 1.570
// la via directa tiene riesgo alto y el desvio por C riesgo bajo
const A: [number, number] = [4.6, -74.1];
const B: [number, number] = [4.6, -74.09];
const C: [number, number] = [4.605, -74.095];
const D: [number, number] = [4.62, -74.1];
const E: [number, number] = [4.62, -74.09];

const VIAS: ViaCiclista[] = [
  { id: 1, tipo: 'ciclovia', riesgo: 'alto', nodos: [1, 2], coordenadas: [A, B] },
  { id: 2, tipo: 'ciclovia', riesgo: 'bajo', nodos: [1, 3], coordenadas: [A, C] },
  { id: 3, tipo: 'ciclovia', riesgo: 'bajo', nodos: [3, 2], coordenadas: [C, B] },
  { id: 4, tipo: 'ciclovia', riesgo: null, nodos: [4, 5], coordenadas: [D, E] },
];

describe('Rutas de la app movil (e2e)', () => {
  const ruta = '/api/mobile/v1/routes';
  const consulta = { origenLat: 4.6001, origenLon: -74.1001, destinoLat: 4.6001, destinoLon: -74.0899 };
  let app: INestApplication;
  let autorizacion: string;

  const calcular = (parametros: Record<string, unknown>, conToken = true) => {
    const peticion = request(app.getHttpServer()).get(ruta).query(parametros);
    return conToken ? peticion.set('Authorization', autorizacion) : peticion;
  };

  beforeAll(async () => {
    process.env.JWT_SECRET = 'secreto-de-pruebas-con-mas-de-32-caracteres';
    autorizacion = `Bearer ${firmarToken(1)}`;
    const vias = VIAS;
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RED_CICLOVIAS_REPOSITORY)
      .useValue({ obtenerVias: async () => vias })
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('responde 401 sin token', async () => {
    const respuesta = await calcular(consulta, false);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('TOKEN_INVALIDO');
  });

  it('responde 200 con la ruta segura, la equilibrada y la rapida en camelCase', async () => {
    const respuesta = await calcular(consulta);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.riesgoDisponible).toBe(true);
    expect(respuesta.body.rutas.map((r: { tipo: string }) => r.tipo)).toEqual(['segura', 'equilibrada', 'rapida']);
    expect(Object.keys(respuesta.body.rutas[0]).sort()).toEqual(
      ['coordenadas', 'distanciaM', 'duracionS', 'pasos', 'porcentajeEnCiclovia', 'tipo'].sort(),
    );
    expect(respuesta.body.rutas[0].coordenadas[0]).toEqual([consulta.origenLat, consulta.origenLon]);
    expect(respuesta.body.rutas[0].pasos[0].tipo).toBe('salida');
  });

  it('la segura esquiva el tramo de riesgo alto y la rapida no', async () => {
    const { rutas } = (await calcular(consulta)).body as { rutas: { tipo: string; distanciaM: number }[] };
    const distancia = (tipo: string) => (rutas.find((ruta) => ruta.tipo === tipo) as { distanciaM: number }).distanciaM;

    expect(distancia('rapida')).toBeLessThan(1200);
    expect(distancia('segura')).toBeGreaterThan(1500);
  });

  it('responde 400 si falta un parametro, sobra uno o no es un numero', async () => {
    const sinDestino = await calcular({ origenLat: 4.6, origenLon: -74.1 });
    const conExtra = await calcular({ ...consulta, extra: 'x' });
    const noNumero = await calcular({ ...consulta, origenLat: 'abc' });
    const fueraDeRango = await calcular({ ...consulta, destinoLat: 95 });

    expect([sinDestino.status, conExtra.status, noNumero.status, fueraDeRango.status]).toEqual([400, 400, 400, 400]);
  });

  it('responde 400 con RUTA_INVALIDA si el origen y el destino son el mismo lugar', async () => {
    const respuesta = await calcular({ ...consulta, destinoLat: consulta.origenLat, destinoLon: consulta.origenLon });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('RUTA_INVALIDA');
  });

  it('responde 400 con RUTA_FUERA_DE_COBERTURA si el origen esta lejos de toda ciclovia', async () => {
    const respuesta = await calcular({ ...consulta, origenLat: 4.7, origenLon: -74.1 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('RUTA_FUERA_DE_COBERTURA');
  });

  it('responde 400 con RUTA_SIN_CAMINO si no hay conexion entre las ciclovias del origen y del destino', async () => {
    const respuesta = await calcular({ ...consulta, destinoLat: 4.6201, destinoLon: -74.0899 });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('RUTA_SIN_CAMINO');
  });
});
