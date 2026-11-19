// Ruta de la pantalla del frontend que recibe el token y pide la contrasena nueva
const RUTA_RESTABLECER = '/restablecer-contrasena';

// DASHBOARD_URL es la direccion del frontend del dashboard y sin ella el enlace solo trae la ruta
export function enlaceDeRestablecimiento(token: string): string {
  return `${process.env.DASHBOARD_URL ?? ''}${RUTA_RESTABLECER}?token=${encodeURIComponent(token)}`;
}
