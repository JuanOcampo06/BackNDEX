import { Injectable } from '@nestjs/common';
import { cifrarContrasena } from '../../../../platform/auth';
import { ContrasenaCifradorPort } from '../application/contrasena-cifrador.port';

// Cifra con scrypt usando la herramienta comun de platform/auth asi el login la puede comparar
@Injectable()
export class ScryptContrasenaCifrador implements ContrasenaCifradorPort {
  cifrar(contrasena: string): Promise<string> {
    return cifrarContrasena(contrasena);
  }
}
