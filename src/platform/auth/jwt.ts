import { createHmac, timingSafeEqual } from 'node:crypto';

// El token dura una semana y despues el ciudadano tiene que iniciar sesion otra vez
const DURACION_SEGUNDOS = 7 * 24 * 60 * 60;

// Un JWT siempre empieza con este encabezado y solo se acepta este algoritmo
const ENCABEZADO = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

// Lo que guarda el token: sub es el id del ciudadano y iat y exp son segundos desde 1970
export interface PayloadToken {
  sub: number;
  iat: number;
  exp: number;
}

// El secreto viene de la variable JWT_SECRET y sin el no se puede firmar ni verificar
function leerSecreto(): string {
  const secreto = process.env.JWT_SECRET;
  if (secreto === undefined || secreto === '') {
    throw new Error('Falta la variable de entorno JWT_SECRET');
  }
  return secreto;
}

function firmar(contenido: string): string {
  return createHmac('sha256', leerSecreto()).update(contenido).digest('base64url');
}

// Crea un JWT HS256 para el ciudadano con el formato estandar encabezado.payload.firma
export function firmarToken(usuarioId: number, ahoraMs: number = Date.now()): string {
  const iat = Math.floor(ahoraMs / 1000);
  const payload: PayloadToken = { sub: usuarioId, iat, exp: iat + DURACION_SEGUNDOS };
  const contenido = `${ENCABEZADO}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}`;
  return `${contenido}.${firmar(contenido)}`;
}

// Devuelve el contenido del token si la firma es correcta y no ha vencido y si no devuelve null
export function verificarToken(token: string, ahoraMs: number = Date.now()): PayloadToken | null {
  const partes = token.split('.');
  if (partes.length !== 3 || partes[0] !== ENCABEZADO) {
    return null;
  }
  const esperada = Buffer.from(firmar(`${partes[0]}.${partes[1]}`));
  const recibida = Buffer.from(partes[2]);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
    return null;
  }
  return leerPayload(partes[1], ahoraMs);
}

// La firma ya es correcta pero igual se revisa que el contenido tenga la forma esperada y no haya vencido
function leerPayload(payloadCodificado: string, ahoraMs: number): PayloadToken | null {
  try {
    const payload = JSON.parse(Buffer.from(payloadCodificado, 'base64url').toString('utf8')) as PayloadToken;
    const valido = Number.isInteger(payload.sub) && Number.isInteger(payload.exp) && payload.exp > ahoraMs / 1000;
    return valido ? payload : null;
  } catch {
    return null;
  }
}
