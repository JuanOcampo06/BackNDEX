import { Preferencias, PREFERENCIAS_POR_DEFECTO } from '../domain/preferencias';
import { ActualizarPreferenciasUseCase } from './actualizar-preferencias.use-case';
import { ObtenerPreferenciasUseCase } from './obtener-preferencias.use-case';
import { PreferenciasRepositoryPort } from './preferencias.repository.port';

// Repositorio en memoria donde solo existe el ciudadano 1
function repositorioEnMemoria(): PreferenciasRepositoryPort & { guardadas: Map<number, Preferencias> } {
  const guardadas = new Map<number, Preferencias>();
  return {
    guardadas,
    buscar: async (usuarioId) => guardadas.get(usuarioId) ?? null,
    guardar: async (usuarioId, preferencias) => {
      if (usuarioId !== 1) return false;
      guardadas.set(usuarioId, preferencias);
      return true;
    },
  };
}

describe('Preferencias del ciudadano', () => {
  it('quien nunca guardo nada recibe los valores por defecto', async () => {
    expect(await new ObtenerPreferenciasUseCase(repositorioEnMemoria()).execute(1)).toEqual(PREFERENCIAS_POR_DEFECTO);
  });

  it('lo que se guarda en un celular se lee igual desde otro', async () => {
    const repositorio = repositorioEnMemoria();
    await new ActualizarPreferenciasUseCase(repositorio).execute(1, { avatar: 'tortuga', voz: false });
    await new ActualizarPreferenciasUseCase(repositorio).execute(1, { alertas: { distanciaM: 500 } });

    const leidas = await new ObtenerPreferenciasUseCase(repositorio).execute(1);

    expect(leidas).toMatchObject({ avatar: 'tortuga', voz: false, alertas: { distanciaM: 500, vibracion: true } });
  });

  it('responde USUARIO_NO_ENCONTRADO si el ciudadano ya no existe', async () => {
    await expect(new ActualizarPreferenciasUseCase(repositorioEnMemoria()).execute(9, { tema: 'claro' })).rejects.toMatchObject({
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });
});
