import { ActivacionSos } from '../domain/activacion-sos';
import { EstadoSos } from '../domain/catalogos';
import { ActivarSosUseCase } from './activar-sos.use-case';
import { CancelarSosUseCase } from './cancelar-sos.use-case';
import { SosRepositoryPort } from './sos.repository.port';

// Repositorio falso que guarda en memoria y solo conoce al usuario 1
function crearRepositorio(): SosRepositoryPort {
  const guardadas: ActivacionSos[] = [];
  return {
    existeUsuario: async (id) => id === 1,
    guardar: async (nueva) => {
      const activacion: ActivacionSos = { id: guardadas.length + 1, ...nueva, estado: 'activa', activadoEn: '2026-10-22T18:00:00.000Z' };
      guardadas.push(activacion);
      return activacion;
    },
    listar: async () => guardadas,
    buscarPorId: async (id) => guardadas.find((a) => a.id === id) ?? null,
    cambiarEstado: async (id, estado: EstadoSos) => {
      const activacion = guardadas.find((a) => a.id === id) as ActivacionSos;
      activacion.estado = estado;
      return activacion;
    },
  };
}

describe('ActivarSosUseCase', () => {
  it('guarda la activacion como activa', async () => {
    const activacion = await new ActivarSosUseCase(crearRepositorio()).execute({ usuarioId: 1, latitud: 4.65, longitud: -74.08 });

    expect(activacion.estado).toBe('activa');
  });

  it('rechaza una ubicacion fuera de rango', async () => {
    await expect(new ActivarSosUseCase(crearRepositorio()).execute({ usuarioId: 1, latitud: 4.65, longitud: -200 })).rejects.toMatchObject({
      codigo: 'SOS_INVALIDO',
    });
  });

  it('rechaza un ciudadano que no existe', async () => {
    await expect(new ActivarSosUseCase(crearRepositorio()).execute({ usuarioId: 99, latitud: 4.65, longitud: -74.08 })).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});

describe('CancelarSosUseCase', () => {
  it('cancela una activacion que sigue activa', async () => {
    const repositorio = crearRepositorio();
    await new ActivarSosUseCase(repositorio).execute({ usuarioId: 1, latitud: 4.65, longitud: -74.08 });

    const cancelada = await new CancelarSosUseCase(repositorio).execute(1);

    expect(cancelada.estado).toBe('cancelada');
  });

  it('no deja cancelar dos veces la misma activacion', async () => {
    const repositorio = crearRepositorio();
    await new ActivarSosUseCase(repositorio).execute({ usuarioId: 1, latitud: 4.65, longitud: -74.08 });
    await new CancelarSosUseCase(repositorio).execute(1);

    await expect(new CancelarSosUseCase(repositorio).execute(1)).rejects.toMatchObject({ codigo: 'SOS_INVALIDO' });
  });

  it('avisa cuando la activacion no existe', async () => {
    await expect(new CancelarSosUseCase(crearRepositorio()).execute(5)).rejects.toMatchObject({ codigo: 'SOS_NO_ENCONTRADO' });
  });
});
