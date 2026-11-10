import { crearNuevoCiudadano, DatosRegistro } from '../domain/ciudadano';
import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { Sesion } from './sesion';
import { TokenEmisorPort } from './token-emisor.port';

// El ciudadano se registra: se validan las reglas, se comprueba el correo, se cifra la contrasena y queda con sesion abierta
export class RegistrarCiudadanoUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
    private readonly tokens: TokenEmisorPort,
    // La fecha de hoy se entrega desde aqui para que las pruebas puedan fijarla
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(datos: DatosRegistro): Promise<Sesion> {
    const { ciudadano, contrasena } = crearNuevoCiudadano(datos, this.ahora());
    if (await this.ciudadanos.existeCorreo(ciudadano.correo)) {
      throw new CorreoDuplicadoError(ciudadano.correo);
    }
    const guardado = await this.ciudadanos.crear(ciudadano, await this.cifrador.cifrar(contrasena));
    return { accessToken: this.tokens.emitir(guardado.id), ciudadano: guardado };
  }
}
