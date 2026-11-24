import { aplicarCambios, CambiosPreferencias, Preferencias, PREFERENCIAS_POR_DEFECTO } from '../domain/preferencias';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { PreferenciasRepositoryPort } from './preferencias.repository.port';

// Cambia solo lo que el ciudadano toco en la app y deja igual el resto de lo que ya tenia guardado
export class ActualizarPreferenciasUseCase {
  constructor(private readonly preferencias: PreferenciasRepositoryPort) {}

  async execute(usuarioId: number, cambios: CambiosPreferencias): Promise<Preferencias> {
    const actuales = (await this.preferencias.buscar(usuarioId)) ?? PREFERENCIAS_POR_DEFECTO;
    const nuevas = aplicarCambios(actuales, cambios);
    if (!(await this.preferencias.guardar(usuarioId, nuevas))) {
      throw new UsuarioNoEncontradoError(usuarioId);
    }
    return nuevas;
  }
}
