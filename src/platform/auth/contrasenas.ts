import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsincrono = promisify(scrypt) as (contrasena: string, sal: Buffer, largo: number) => Promise<Buffer>;
const LARGO_CLAVE = 64;
const LARGO_SAL = 16;
const LARGO_TOKEN = 32;

// Cifra con scrypt que ya viene en Node y asi no hace falta instalar nada
// se guarda como scrypt$sal$clave en hexadecimal y cada contrasena lleva su propia sal
export async function cifrarContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(LARGO_SAL);
  const clave = await scryptAsincrono(contrasena, sal, LARGO_CLAVE);
  return `scrypt$${sal.toString('hex')}$${clave.toString('hex')}`;
}

// Compara en tiempo constante para no dar pistas de la contrasena por lo que tarda
export async function contrasenaCoincide(contrasena: string, contrasenaCifrada: string): Promise<boolean> {
  const [algoritmo, sal, clave] = contrasenaCifrada.split('$');
  if (algoritmo !== 'scrypt' || sal === undefined || clave === undefined) {
    return false;
  }
  const esperada = Buffer.from(clave, 'hex');
  const calculada = await scryptAsincrono(contrasena, Buffer.from(sal, 'hex'), esperada.length);
  return esperada.length === calculada.length && timingSafeEqual(esperada, calculada);
}

// Token al azar para enlaces de un solo uso como el de restablecer la contrasena
export function crearTokenAleatorio(): string {
  return randomBytes(LARGO_TOKEN).toString('base64url');
}

// Lo que se guarda en la base es el hash del token asi quien lea la tabla no puede usarlo
export function hashDeToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
