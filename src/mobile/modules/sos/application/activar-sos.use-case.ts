import { ActivacionSos, crearNuevaActivacion, NuevaActivacionSos } from '../domain/activacion-sos';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { SosRepositoryPort } from './sos.repository.port';

// El ciudadano presiona el boton de panico: se valida la ubicacion, se comprueba el usuario y se guarda
export class ActivarSosUseCase {
  constructor(private readonly sos: SosRepositoryPort) {}

  async execute(datos: NuevaActivacionSos): Promise<ActivacionSos> {
    const nueva = crearNuevaActivacion(datos);
    if (!(await this.sos.existeUsuario(nueva.usuarioId))) {
      throw new UsuarioNoEncontradoError(nueva.usuarioId);
    }
    return this.sos.guardar(nueva);
  }
}
