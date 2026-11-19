import { AUDIENCIA_DASHBOARD, firmarToken } from '../src/platform/auth';

// Id de cada rol en la tabla falsa de usuarios de dashboard-falsos.ts
// el guard lee el rol de la tabla y no del token asi que el id debe ser el de un usuario con ese rol
const ID_POR_ROL: Record<string, number> = { admin: 1, lector: 2 };

// Arma el encabezado Authorization con un token del dashboard para las pruebas
// por defecto es del Administrador y con lector es del Usuario que solo consulta
export function tokenDashboard(rol = 'admin', ahoraMs = Date.now(), usuarioId = ID_POR_ROL[rol]): string {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-pruebas-con-mas-de-32-caracteres';
  return `Bearer ${firmarToken(usuarioId, ahoraMs, { aud: AUDIENCIA_DASHBOARD, rol })}`;
}
