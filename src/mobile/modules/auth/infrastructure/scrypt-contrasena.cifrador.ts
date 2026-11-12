import { Injectable } from '@nestjs/common';
import { cifrarContrasena, contrasenaCoincide } from '../../../../platform/auth';
import { ContrasenaCifradorPort } from '../application/contrasena-cifrador.port';

// Cifra con scrypt usando la herramienta comun de platform/auth que tambien usa el dashboard
// se guarda como scrypt$sal$clave en hexadecimal y cada contrasena lleva su propia sal
@Injectable()
export class ScryptContrasenaCifrador implements ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string> {
    return cifrarContrasena(contrasena);
  }

  coincide(contrasena: string, contrasenaCifrada: string): Promise<boolean> {
    return contrasenaCoincide(contrasena, contrasenaCifrada);
  }
}
