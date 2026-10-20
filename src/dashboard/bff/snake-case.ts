// Cambia las claves de camelCase a snake_case porque el BFF del dashboard responde asi
// solo cambia los nombres de las claves y nunca los valores
export function aSnakeCase(valor: unknown): unknown {
  if (Array.isArray(valor)) {
    return valor.map(aSnakeCase);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([clave, interno]) => [
        clave.replace(/[A-Z]/g, (letra) => `_${letra.toLowerCase()}`),
        aSnakeCase(interno),
      ]),
    );
  }
  return valor;
}
