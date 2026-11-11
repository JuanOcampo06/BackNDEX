// Roles del dashboard: admin administra usuarios y lector solo consulta
export const ROLES = ['admin', 'lector'] as const;

// Rol del Administrador que es el unico que puede exportar y gestionar usuarios
export const ROL_ADMINISTRADOR = 'admin';
export type Rol = (typeof ROLES)[number];
