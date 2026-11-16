import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Workbook } from 'exceljs';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { TABLERO_REPOSITORY, TableroRepositoryPort } from '../src/dashboard/modules/kpis/application/tablero.repository.port';
import { tokenDashboard } from './token-dashboard';

// Repositorio falso para probar la puerta HTTP sin necesitar PostgreSQL
function crearRepositorioFalso(): TableroRepositoryPort {
  return {
    listarLocalidades: async () => [{ id: 4, nombre: 'Engativa' }],
    buscarRangoDeMeses: async () => ({ primerMes: null, ultimoMes: null }),
    buscarFechasDeCorte: async () => ({ anuario: null, ciclovias: null }),
    contarPorSemana: async () => [{ semana: '2026-08-03', total: 10 }],
    listarSiniestros: async () => [],
    contarSiniestrosPorLugarYHora: async () => [{ lugar: 'Av. Boyaca x Calle 80', localidad: 'Engativa', hora: 7, total: 3 }],
    contarSiniestrosPorMes: async () => [],
    contarVictimasPorSexoYEdad: async () => [],
    contarUsuariosPorTipo: async () => [],
    contarActivacionesPorLugar: async () => [],
    listarReportes: async () => [],
    contarFalsosPositivosPorMotivo: async () => [],
    contarFalsosPositivosPorMes: async () => [],
  };
}

describe('GET /api/dashboard/v1/tablero/exportar (e2e)', () => {
  const ruta = '/api/dashboard/v1/tablero/exportar';
  const TIPO_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  let app: INestApplication;

  beforeAll(async () => {
    const modulo = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(TABLERO_REPOSITORY)
      .useValue(crearRepositorioFalso())
      .compile();
    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // Junta los bytes de la respuesta para poder abrirlos como Excel
  const descargar = (url: string) =>
    request(app.getHttpServer())
      .get(url)
      .set('Authorization', tokenDashboard())
      .buffer(true)
      .parse((respuesta, terminar) => {
        const partes: Buffer[] = [];
        respuesta.on('data', (parte: Buffer) => partes.push(parte));
        respuesta.on('end', () => terminar(null, Buffer.concat(partes)));
      });

  it('descarga un xlsx con una hoja de filtros y una hoja por cada KPI elegido', async () => {
    const respuesta = await descargar(`${ruta}?kpis=tarjeta_siniestros&kpis=siniestros_por_hora&mes_desde=2026-08&mes_hasta=2026-10`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.headers['content-type']).toContain(TIPO_XLSX);
    expect(respuesta.headers['content-disposition']).toBe('attachment; filename="kpis_2026-08_2026-10.xlsx"');
    const excel = await new Workbook().xlsx.load(respuesta.body);
    expect(excel.worksheets.map((hoja) => hoja.name)).toEqual(['Filtros aplicados', 'Tarjeta Siniestros', 'Siniestros por hora']);
  });

  it('acepta los KPIs separados por comas', async () => {
    const respuesta = await descargar(`${ruta}?kpis=tarjeta_usuarios,tarjeta_reportes`);

    const excel = await new Workbook().xlsx.load(respuesta.body);
    expect(excel.worksheets.map((hoja) => hoja.name)).toEqual(['Filtros aplicados', 'Tarjeta Usuarios', 'Tarjeta Reportes']);
  });

  it('responde 400 si no llega ningun KPI', async () => {
    const respuesta = await request(app.getHttpServer()).get(ruta).set('Authorization', tokenDashboard());

    expect(respuesta.status).toBe(400);
  });

  it('responde 400 si un KPI no existe o un filtro es invalido', async () => {
    const kpiMalo = await request(app.getHttpServer()).get(`${ruta}?kpis=otro`).set('Authorization', tokenDashboard());
    const filtroMalo = await request(app.getHttpServer()).get(`${ruta}?kpis=reportes&tipo_vehiculo=carro`).set('Authorization', tokenDashboard());
    const parametroExtra = await request(app.getHttpServer()).get(`${ruta}?kpis=reportes&otro=1`).set('Authorization', tokenDashboard());

    expect([kpiMalo.status, filtroMalo.status, parametroExtra.status]).toEqual([400, 400, 400]);
  });

  it('responde 400 con codigo y mensaje si el rango de meses esta al reves', async () => {
    const respuesta = await request(app.getHttpServer()).get(`${ruta}?kpis=reportes&mes_desde=2026-10&mes_hasta=2026-08`).set('Authorization', tokenDashboard());

    expect(respuesta.status).toBe(400);
    expect(respuesta.body).toEqual({
      codigo: 'PERIODO_INVALIDO',
      mensaje: 'El mes inicial no puede ser posterior al mes final',
    });
  });
});
