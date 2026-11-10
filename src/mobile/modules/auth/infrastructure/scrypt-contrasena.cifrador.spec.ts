import { ScryptContrasenaCifrador } from './scrypt-contrasena.cifrador';

describe('ScryptContrasenaCifrador', () => {
  const cifrador = new ScryptContrasenaCifrador();

  it('reconoce la contrasena correcta y rechaza otra', async () => {
    const cifrada = await cifrador.cifrar('demo1234');

    expect(await cifrador.coincide('demo1234', cifrada)).toBe(true);
    expect(await cifrador.coincide('demo12345', cifrada)).toBe(false);
  });

  it('no guarda la contrasena en texto plano y cada cifrado lleva su propia sal', async () => {
    const primera = await cifrador.cifrar('demo1234');
    const segunda = await cifrador.cifrar('demo1234');

    expect(primera).not.toContain('demo1234');
    expect(primera).toMatch(/^scrypt\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
    expect(primera).not.toBe(segunda);
  });

  it('rechaza un valor guardado que no tiene el formato esperado', async () => {
    expect(await cifrador.coincide('demo1234', 'texto-cualquiera')).toBe(false);
    expect(await cifrador.coincide('demo1234', 'bcrypt$a$b')).toBe(false);
  });
});
