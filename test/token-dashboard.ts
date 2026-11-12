import { AUDIENCIA_DASHBOARD, firmarToken } from '../src/platform/auth';

// Arma el encabezado Authorization con un token del dashboard para las pruebas
// por defecto es del Administrador y con lector es del Usuario que solo consulta
export function tokenDashboard(rol = 'admin', ahoraMs = Date.now()): string {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas-con-mas-de-32-caracteres';
  return `Bearer ${firmarToken(1, ahoraMs, { aud: AUDIENCIA_DASHBOARD, rol })}`;
}
