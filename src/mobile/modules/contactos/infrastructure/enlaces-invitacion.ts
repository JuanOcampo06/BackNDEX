// Direccion publica de la api para armar los enlaces del correo: el contacto los abre desde su propio celular o computador
// en local sirve http://localhost:3001 y en produccion debe ser la direccion publica (API_URL_PUBLICA)
const RUTA_INVITACIONES = '/api/mobile/v1/invitaciones';

export function enlaceRespuesta(token: string, respuesta: 'acepto' | 'rechazo'): string {
  const base = (process.env.API_URL_PUBLICA || `http://localhost:${process.env.PORT || '3001'}`).replace(/\/+$/, '');
  return `${base}${RUTA_INVITACIONES}/${encodeURIComponent(token)}?respuesta=${respuesta}`;
}

// Escapa el texto que escribe un usuario antes de ponerlo en HTML para que nadie pueda meter codigo en el correo
export function escaparHtml(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
