import { Injectable } from '@nestjs/common';
import { cifrarContrasena, contrasenaCoincide } from '../../../../platform/auth';
import { ContrasenaCifradorPort } from '../application/contrasena-cifrador.port';

// Usa el mismo cifrado scrypt de platform/auth con el que se guardan las contrasenas de los usuarios
@Injectable()
export class ScryptContrasenaCifrador implements ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string> {
    return cifrarContrasena(contrasena);
  }

  coincide(contrasena: string, contrasenaCifrada: string): Promise<boolean> {
    return contrasenaCoincide(contrasena, contrasenaCifrada);
  }
}
