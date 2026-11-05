import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Workbook } from 'exceljs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { FiltrosTablero } from '../src/dashboard/modules/kpis';
import { TABLERO_REPOSITORY, TableroRepositoryPort } from '../src/dashboard/modules/kpis/application/tablero.repository.port';

// Repositorio falso que guarda los filtros que le llegan para ver como los entrego la puerta HTTP
function crearRepositorioFalso(alRecibir: (filtros: FiltrosTablero) => void): TableroRepositoryPort {
  return {
    listarLocalidades: async () => [
      { id: 4, nombre: 'Engativa' },
      { id: 6, nombre: 'Kennedy' },
    ],
    contarPorSemana: async (_indicador, filtros) => {
      alRecibir(filtros);
      return [{ semana: '2026-08-03', total: 10 }];
    },
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

describe('Filtros con varios valores del tablero (e2e)', () => {
  const tarjeta = '/api/dashboard/v1/tablero/tarjetas/siniestros';
  const exportar = '/api/dashboard/v1/tablero/exportar';
  let app: INestApplication;
  let recibido: FiltrosTablero | undefined;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TABLERO_REPOSITORY)
      .useValue(crearRepositorioFalso((filtros) => (recibido = filtros)))
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  beforeEach(() => {
    recibido = undefined;
  });

  afterAll(async () => {
    await app.close();
  });

  it('entrega cada filtro como lista cuando llega repetido o separado por comas', async () => {
    const respuesta = await request(app.getHttpServer()).get(
      `${tarjeta}?localidad_id=4&localidad_id=6&tipo_vehiculo=bicicleta,patineta`,
    );

    expect(respuesta.status).toBe(200);
    expect(recibido).toMatchObject({ localidadId: [4, 6], tipoVehiculo: ['bicicleta', 'patineta'] });
  });

  it('acepta mezclar las dos formas en un mismo filtro', async () => {
    await request(app.getHttpServer()).get(`${tarjeta}?localidad_id=1,2&localidad_id=3`);

    expect(recibido?.localidadId).toEqual([1, 2, 3]);
  });

  it('un solo valor sigue funcionando y queda como lista de uno', async () => {
    await request(app.getHttpServer()).get(`${tarjeta}?localidad_id=4&tipo_vehiculo=bicicleta`);

    expect(recibido).toMatchObject({ localidadId: [4], tipoVehiculo: ['bicicleta'] });
  });

  it('sin filtros no manda ninguna lista', async () => {
    await request(app.getHttpServer()).get(tarjeta);

    expect(recibido?.localidadId).toBeUndefined();
    expect(recibido?.tipoVehiculo).toBeUndefined();
  });

  it('responde 400 si un solo valor de la lista es invalido aunque los demas esten bien', async () => {
    const respuestas = await Promise.all(
      [
        `${tarjeta}?tipo_vehiculo=bicicleta,carro`,
        `${tarjeta}?localidad_id=4,abc`,
        `${tarjeta}?localidad_id=4&localidad_id=0`,
        `${tarjeta}?localidad_id=4.5`,
        `${tarjeta}?tipo_vehiculo=`,
        // La fuente ya no existe como filtro y por eso se rechaza
        `${tarjeta}?fuente=app`,
      ].map((url) => request(app.getHttpServer()).get(url)),
    );

    expect(respuestas.map((respuesta) => respuesta.status)).toEqual([400, 400, 400, 400, 400, 400]);
    expect(recibido).toBeUndefined();
  });

  it('el mensaje de error dice cuales son los valores permitidos', async () => {
    const respuesta = await request(app.getHttpServer()).get(`${tarjeta}?tipo_vehiculo=bicicleta,carro`);

    expect(respuesta.body.message).toEqual([expect.stringContaining('bicicleta, bicicleta_electrica, patineta_electrica')]);
  });

  it('la exportacion a Excel tambien acepta varios valores y los muestra en la hoja de filtros', async () => {
    const respuesta = await request(app.getHttpServer())
      .get(`${exportar}?kpis=tarjeta_siniestros&localidad_id=4,6&tipo_vehiculo=bicicleta&tipo_vehiculo=patineta`)
      .buffer(true)
      .parse((res, terminar) => {
        const partes: Buffer[] = [];
        res.on('data', (parte: Buffer) => partes.push(parte));
        res.on('end', () => terminar(null, Buffer.concat(partes)));
      });

    expect(respuesta.status).toBe(200);
    const excel = await new Workbook().xlsx.load(respuesta.body);
    const filas = excel.getWorksheet('Filtros aplicados')?.getSheetValues().slice(1) as unknown[][];
    expect(filas.find((fila) => fila?.[1] === 'Localidad')?.[2]).toBe('Engativa, Kennedy');
    expect(filas.find((fila) => fila?.[1] === 'Tipo de vehículo')?.[2]).toBe('Bicicleta, Patineta');
  });
});
