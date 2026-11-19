import { crearNuevoCiudadano, DatosRegistro } from '../domain/ciudadano';
import { CorreoDuplicadoError } from '../domain/correo-duplicado.error';
import { VERSION_TERMINOS } from '../domain/terminos';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { Sesion } from './sesion';
import { SolicitaVerificacion } from './solicitar-verificacion.use-case';
import { TokenEmisorPort } from './token-emisor.port';

// El ciudadano se registra: se validan las reglas (incluida la aceptacion de los terminos), se comprueba el correo, se cifra la contrasena,
// queda con sesion abierta y le llega al correo el codigo para verificarlo
export class RegistrarCiudadanoUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
    private readonly tokens: TokenEmisorPort,
    private readonly verificacion: SolicitaVerificacion,
    // La fecha de hoy se entrega desde aqui para que las pruebas puedan fijarla
    private readonly ahora: () => Date = () => new Date(),
  ) {}

  async execute(datos: DatosRegistro): Promise<Sesion> {
    const { ciudadano, contrasena } = crearNuevoCiudadano(datos, this.ahora());
    if (await this.ciudadanos.existeCorreo(ciudadano.correo)) {
      throw new CorreoDuplicadoError(ciudadano.correo);
    }
    const aceptacion = { version: VERSION_TERMINOS, aceptadoEn: this.ahora() };
    const guardado = await this.ciudadanos.crear(ciudadano, await this.cifrador.cifrar(contrasena), aceptacion);
    await this.verificacion.execute({ correo: guardado.correo, ahora: this.ahora() });
    return { accessToken: this.tokens.emitir(guardado.id), ciudadano: guardado };
  }
}
