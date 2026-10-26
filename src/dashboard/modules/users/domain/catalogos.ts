// Roles del dashboard: admin administra usuarios y lector solo consulta
export const ROLES = ['admin', 'lector'] as const;
export type Rol = (typeof ROLES)[number];
