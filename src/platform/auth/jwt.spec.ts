import { firmarToken, validarSecretoJwt, verificarToken } from './jwt';

const AHORA = Date.parse('2026-11-08T12:00:00.000Z');
const UNA_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

describe('jwt', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'secreto-de-pruebas';
  });

  it('un token recien firmado se verifica y trae el id del ciudadano', () => {
    const token = firmarToken(7, AHORA);

    expect(verificarToken(token, AHORA)).toMatchObject({ sub: 7 });
  });

  it('rechaza un token vencido', () => {
    const token = firmarToken(7, AHORA);

    expect(verificarToken(token, AHORA + UNA_SEMANA_MS + 1000)).toBeNull();
  });

  it('rechaza un token con la firma cambiada o con otro secreto', () => {
    const token = firmarToken(7, AHORA);
    const [encabezado, payload] = token.split('.');

    expect(verificarToken(`${encabezado}.${payload}.firma-falsa`, AHORA)).toBeNull();
    process.env.JWT_SECRET = 'otro-secreto';
    expect(verificarToken(token, AHORA)).toBeNull();
  });

  it('rechaza un token con el payload cambiado a otro ciudadano', () => {
    const [encabezado, , firma] = firmarToken(7, AHORA).split('.');
    const payloadFalso = Buffer.from(JSON.stringify({ sub: 1, iat: 0, exp: 9_999_999_999 })).toString('base64url');

    expect(verificarToken(`${encabezado}.${payloadFalso}.${firma}`, AHORA)).toBeNull();
  });

  it('rechaza texto que no es un token y el algoritmo none', () => {
    const sinAlgoritmo = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');

    expect(verificarToken('no-es-un-token', AHORA)).toBeNull();
    expect(verificarToken(`${sinAlgoritmo}.e30.`, AHORA)).toBeNull();
  });

  it('sin JWT_SECRET no firma ni verifica', () => {
    delete process.env.JWT_SECRET;

    expect(() => firmarToken(7)).toThrow('JWT_SECRET');
  });

  it('la api no acepta un secreto vacio corto o el del ejemplo y si uno largo', () => {
    for (const malo of ['', 'corto', 'cambia-este-secreto-en-produccion']) {
      process.env.JWT_SECRET = malo;
      expect(() => validarSecretoJwt()).toThrow('JWT_SECRET');
    }
    process.env.JWT_SECRET = 'un-secreto-largo-de-mas-de-treinta-y-dos-caracteres';
    expect(() => validarSecretoJwt()).not.toThrow();
  });
});
