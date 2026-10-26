import { Reporte } from '../domain/reporte';
import { CrearReporteUseCase } from './crear-reporte.use-case';
import { ReportesRepositoryPort } from './reportes.repository.port';

// Repositorio falso que guarda en memoria y solo conoce al usuario 1
function crearRepositorio(): ReportesRepositoryPort {
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

const datosValidos = { usuarioId: 1, categoria: 'via_en_mal_estado', descripcion: '  Hueco grande  ', latitud: 4.65, longitud: -74.08 };

describe('CrearReporteUseCase', () => {
  it('guarda el reporte como recibido y limpia los espacios de la descripcion', async () => {
    const reporte = await new CrearReporteUseCase(crearRepositorio()).execute(datosValidos);

    expect(reporte.id).toBe(1);
    expect(reporte.estado).toBe('recibido');
    expect(reporte.descripcion).toBe('Hueco grande');
  });

  it('guarda null cuando la descripcion viene vacia', async () => {
    const reporte = await new CrearReporteUseCase(crearRepositorio()).execute({ ...datosValidos, descripcion: '   ' });

    expect(reporte.descripcion).toBeNull();
  });

  it('rechaza una categoria que no existe', async () => {
    await expect(new CrearReporteUseCase(crearRepositorio()).execute({ ...datosValidos, categoria: 'otra' })).rejects.toMatchObject({
      codigo: 'REPORTE_INVALIDO',
    });
  });

  it('rechaza una ubicacion fuera de rango', async () => {
    await expect(new CrearReporteUseCase(crearRepositorio()).execute({ ...datosValidos, latitud: 95 })).rejects.toMatchObject({
      codigo: 'REPORTE_INVALIDO',
    });
  });

  it('rechaza una descripcion de mas de 500 caracteres', async () => {
    await expect(new CrearReporteUseCase(crearRepositorio()).execute({ ...datosValidos, descripcion: 'a'.repeat(501) })).rejects.toMatchObject({
      codigo: 'REPORTE_INVALIDO',
    });
  });

  it('rechaza un ciudadano que no existe', async () => {
    await expect(new CrearReporteUseCase(crearRepositorio()).execute({ ...datosValidos, usuarioId: 99 })).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});
