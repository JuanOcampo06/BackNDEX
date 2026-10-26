import { crearNuevoReporte, DatosReporte, Reporte } from '../domain/reporte';
import { UsuarioNoEncontradoError } from '../domain/usuario-no-encontrado.error';
import { ReportesRepositoryPort } from './reportes.repository.port';

// El ciudadano envia un reporte: se validan las reglas, se comprueba que el usuario exista y se guarda
export class CrearReporteUseCase {
  constructor(private readonly reportes: ReportesRepositoryPort) {}

  async execute(datos: DatosReporte): Promise<Reporte> {
    const nuevo = crearNuevoReporte(datos);
    if (!(await this.reportes.existeUsuario(nuevo.usuarioId))) {
      throw new UsuarioNoEncontradoError(nuevo.usuarioId);
    }
    return this.reportes.guardar(nuevo);
  }
}
