import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Injectable } from '@nestjs/common';
import { ContrasenaCifradorPort } from '../application/contrasena-cifrador.port';

const scryptAsincrono = promisify(scrypt) as (contrasena: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO_CLAVE = 64;
const LARGO_SAL = 16;

// Cifra con scrypt que ya viene en Node y asi no hace falta instalar nada
// se guarda como scrypt$sal$clave en hexadecimal y cada contrasena lleva su propia sal
@Injectable()
export class ScryptContrasenaCifrador implements ContrasenaCifradorPort {
  async cifrar(contrasena: string): Promise<string> {
    const sal = randomBytes(LARGO_SAL);
    const clave = await scryptAsincrono(contrasena, sal, LARGO_CLAVE);
    return `scrypt$${sal.toString('hex')}$${clave.toString('hex')}`;
  }

  async coincide(contrasena: string, contrasenaCifrada: string): Promise<boolean> {
    const [algoritmo, sal, clave] = contrasenaCifrada.split('$');
    if (algoritmo !== 'scrypt' || sal === undefined || clave === undefined) {
      return false;
    }
    const esperada = Buffer.from(clave, 'hex');
    const calculada = await scryptAsincrono(contrasena, Buffer.from(sal, 'hex'), esperada.length);
    return esperada.length === calculada.length && timingSafeEqual(esperada, calculada);
  }
}
