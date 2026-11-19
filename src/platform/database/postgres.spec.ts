import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { opcionesSsl } from './postgres';

describe('opcionesSsl', () => {
  it('sin variables usa TLS y verifica el certificado del servidor', () => {
    expect(opcionesSsl({})).toEqual({ rejectUnauthorized: true });
  });

  it('solo DATABASE_SSL=false lo desactiva y cualquier otro valor deja TLS', () => {
    expect(opcionesSsl({ DATABASE_SSL: 'false' })).toBe(false);
    expect(opcionesSsl({ DATABASE_SSL: 'true' })).toEqual({ rejectUnauthorized: true });
    expect(opcionesSsl({ DATABASE_SSL: 'no' })).toEqual({ rejectUnauthorized: true });
  });

  it('con DATABASE_SSL_CA confia en el certificado de ese archivo', () => {
    const carpeta = mkdtempSync(join(tmpdir(), 'ca-'));
    const ruta = join(carpeta, 'global-bundle.pem');
    writeFileSync(ruta, 'certificado-de-prueba');
    try {
      expect(opcionesSsl({ DATABASE_SSL_CA: ruta })).toEqual({ rejectUnauthorized: true, ca: 'certificado-de-prueba' });
    } finally {
      rmSync(carpeta, { recursive: true, force: true });
    }
  });

  it('falla al arrancar si DATABASE_SSL_CA apunta a un archivo que no existe', () => {
    expect(() => opcionesSsl({ DATABASE_SSL_CA: join(tmpdir(), 'no-existe', 'global-bundle.pem') })).toThrow();
  });
});
