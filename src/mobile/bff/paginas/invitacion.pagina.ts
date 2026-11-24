// Paginas HTML sencillas que ve el contacto al tocar Acepto o No acepto en el correo de invitacion
// el contacto no tiene la app ni cuenta: solo un navegador

type Respuesta = 'acepto' | 'rechazo';

// Escapa los nombres que escriben los usuarios para que nadie pueda meter codigo en la pagina
function escapar(texto: string): string {
  return texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function pagina(titulo: string, cuerpo: string): string {
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${titulo} - SafePath Twin</title>
<style>
  body { margin: 0; padding: 24px 16px; font-family: Arial, sans-serif; background: #f3f4f6; color: #1f2937; }
  main { max-width: 440px; margin: auto; background: #fff; border-radius: 12px; padding: 28px 24px; box-shadow: 0 2px 8px rgba(0,0,0,.08); }
  h1 { font-size: 20px; color: #0b2a5b; margin-top: 0; }
  form { display: flex; flex-direction: column; gap: 10px; margin-top: 20px; }
  button { padding: 14px; border: 0; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; }
  .principal { background: #0b2a5b; color: #fff; }
  .secundario { background: #e5e7eb; color: #1f2937; }
  .nota { font-size: 13px; color: #6b7280; }
</style>
</head>
<body><main>${cuerpo}</main></body>
</html>`;
}

// El contacto abrio el enlace: se le pide confirmar con un clic porque algunos correos abren los enlaces solos para revisarlos
// el formulario envia a la misma direccion, asi que no hace falta saber la direccion publica de la api
export function paginaConfirmar(ciudadano: string, contacto: string, elegida: Respuesta | null): string {
  const boton = (respuesta: Respuesta, texto: string) =>
    `<button type="submit" name="respuesta" value="${respuesta}" class="${elegida === null || elegida === respuesta ? 'principal' : 'secundario'}">${texto}</button>`;
  const pregunta =
    elegida === 'acepto' ? '¿Confirmas que aceptas?' : elegida === 'rechazo' ? '¿Confirmas que no aceptas?' : '¿Aceptas la invitación?';
  return pagina(
    'Invitación',
    `<h1>Contacto de emergencia</h1>
<p>Hola ${escapar(contacto)}:</p>
<p><strong>${escapar(ciudadano)}</strong> te invitó a ser parte de sus contactos de emergencia en SafePath Twin. Si aceptas, podrá llamarte desde el botón SOS de la app cuando necesite ayuda en la vía.</p>
<p><strong>${pregunta}</strong></p>
<form method="post">
  ${elegida === 'rechazo' ? boton('rechazo', 'Sí, no acepto') + boton('acepto', 'Mejor sí acepto') : boton('acepto', 'Sí, acepto') + boton('rechazo', 'No acepto')}
</form>`,
  );
}

export function paginaRespondida(ciudadano: string, respuesta: Respuesta): string {
  const nombre = escapar(ciudadano);
  return respuesta === 'acepto'
    ? pagina('Aceptaste', `<h1>¡Listo!</h1><p>Ahora eres contacto de emergencia de <strong>${nombre}</strong>. Podrá llamarte desde el botón SOS de SafePath Twin.</p><p class="nota">Ya puedes cerrar esta página.</p>`)
    : pagina('No aceptaste', `<h1>Invitación rechazada</h1><p>No serás contacto de emergencia de <strong>${nombre}</strong>. Le avisaremos en la app.</p><p class="nota">Ya puedes cerrar esta página.</p>`);
}

export function paginaInvalida(): string {
  return pagina(
    'Invitación no válida',
    `<h1>Esta invitación ya no es válida</h1><p>Puede que ya la hayas contestado, que haya vencido o que te hayan enviado una más nueva.</p><p class="nota">Si quieres ser contacto de emergencia, pídele a la persona que te invite de nuevo desde la app.</p>`,
  );
}
