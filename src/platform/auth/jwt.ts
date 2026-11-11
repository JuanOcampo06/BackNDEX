import { createHmac, timingSafeEqual } from 'node:crypto';

// El token dura una semana y despues hay que iniciar sesion otra vez
const DURACION_SEGUNDOS = 7 * 24 * 60 * 60;

// Un JWT siempre empieza con este encabezado y solo se acepta este algoritmo
const ENCABEZADO = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

// Los tokens del dashboard llevan esta audiencia y su rol asi no sirven en la app movil ni al reves
export const AUDIENCIA_DASHBOARD = 'dashboard';

// Datos opcionales del token donde aud dice para que producto es y rol es el rol del usuario del dashboard
export interface DatosExtraToken {
  aud?: string;
  rol?: string;
}

// Lo que guarda el token donde sub es el id del usuario y iat y exp son segundos desde 1970
export interface PayloadToken extends DatosExtraToken {
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

// Crea un JWT HS256 con el formato estandar encabezado.payload.firma
// sin datos extra es el token de un ciudadano de la app movil
export function firmarToken(usuarioId: number, ahoraMs: number = Date.now(), extra: DatosExtraToken = {}): string {
  const iat = Math.floor(ahoraMs / 1000);
  const payload: PayloadToken = { sub: usuarioId, iat, exp: iat + DURACION_SEGUNDOS, ...extra };
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

// Saca el token del encabezado Authorization: Bearer <token> y lo verifica
export function tokenDeLaPeticion(autorizacion: string | undefined): PayloadToken | null {
  const [tipo, token] = (autorizacion ?? '').split(' ');
  return tipo === 'Bearer' && token !== undefined ? verificarToken(token) : null;
}
