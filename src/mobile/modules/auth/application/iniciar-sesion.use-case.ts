import { validarCorreo } from '../domain/ciudadano';
import { CredencialesInvalidasError } from '../domain/credenciales-invalidas.error';
import { CiudadanosRepositoryPort } from './ciudadanos.repository.port';
import { ContrasenaCifradorPort } from './contrasena-cifrador.port';
import { Sesion } from './sesion';
import { TokenEmisorPort } from './token-emisor.port';

export interface CredencialesLogin {
  correo: string;
  contrasena: string;
}

// El ciudadano inicia sesion con su correo y su contrasena y recibe un token
export class IniciarSesionUseCase {
  constructor(
    private readonly ciudadanos: CiudadanosRepositoryPort,
    private readonly cifrador: ContrasenaCifradorPort,
    private readonly tokens: TokenEmisorPort,
  ) {}

  async execute(credenciales: CredencialesLogin): Promise<Sesion> {
    const encontrado = await this.ciudadanos.buscarPorCorreo(validarCorreo(credenciales.correo));
    if (encontrado === null || !(await this.cifrador.coincide(credenciales.contrasena, encontrado.contrasenaCifrada))) {
      throw new CredencialesInvalidasError();
    }
    // La contrasena cifrada nunca sale del modulo
    const { id, nombreCompleto, correo, telefono, fechaNacimiento, genero } = encontrado;
    return { accessToken: this.tokens.emitir(id), ciudadano: { id, nombreCompleto, correo, telefono, fechaNacimiento, genero } };
  }
}
