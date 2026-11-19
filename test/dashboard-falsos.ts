import { AvisoRestablecimiento, NotificadorRestablecimientoPort } from '../src/dashboard/modules/auth/application/notificador-restablecimiento.port';
import { RestablecimientosRepositoryPort } from '../src/dashboard/modules/auth/application/restablecimientos.repository.port';
import { UsuarioRepositoryPort } from '../src/dashboard/modules/auth/application/usuario.repository.port';
import { CuentaUsuario } from '../src/dashboard/modules/auth/domain/usuario';
import { TableroRepositoryPort } from '../src/dashboard/modules/kpis/application/tablero.repository.port';
import { UsuariosRepositoryPort } from '../src/dashboard/modules/users/application/usuarios.repository.port';
import { CambiosParaGuardar, Usuario, UsuarioParaGuardar } from '../src/dashboard/modules/users/domain/usuario';
import { cifrarContrasena } from '../src/platform/auth';

// Repositorios falsos del dashboard para probar por HTTP sin PostgreSQL

export function crearTableroFalso(): TableroRepositoryPort {
  return {
    listarLocalidades: async () => [{ id: 8, nombre: 'Kennedy' }],
    buscarRangoDeMeses: async () => ({ primerMes: '2025-01', ultimoMes: '2025-12' }),
    buscarFechasDeCorte: async () => ({ anuario: '2025-12-31', ciclovias: '2026-10-22' }),
    contarPorSemana: async () => [],
    listarSiniestros: async () => [],
    contarSiniestrosPorLugarYHora: async () => [],
    contarSiniestrosPorMes: async () => [],
    contarVictimasPorSexoYEdad: async () => [],
    contarUsuariosPorTipo: async () => [],
    contarActivacionesPorLugar: async () => [],
    listarReportes: async () => [],
    contarFalsosPositivosPorMotivo: async () => [],
    contarFalsosPositivosPorMes: async () => [],
    contarReportesPorSubcategoria: async () => [],
  };
}

type Fila = Usuario & { contrasenaCifrada: string | null };

export interface TablaDeUsuariosFalsa {
  usuarios: UsuariosRepositoryPort;
  cuentas: UsuarioRepositoryPort;
}

// Una sola tabla de usuarios en memoria que comparten el modulo users y el login
// asi se prueba que un usuario creado desde el tablero puede iniciar sesion
// sin los usuarios de prueba empieza vacia como una base recien creada
export async function crearTablaDeUsuariosFalsa(conUsuariosDePrueba = true): Promise<TablaDeUsuariosFalsa> {
  const FECHA = '2026-11-01T00:00:00.000Z';
  const clave = await cifrarContrasena('demo1234');
  const base = { ultimoIngreso: null, creadoEn: FECHA, actualizadoEn: FECHA, contrasenaCifrada: clave, debeCambiarContrasena: false };
  const filas: Fila[] = !conUsuariosDePrueba ? [] : [
    { ...base, id: 1, nombreCompleto: 'Admin Demo', correo: 'admin@demo.local', rol: 'admin', entidad: 'Secretaría Distrital de Movilidad' },
    { ...base, id: 2, nombreCompleto: 'Lector Demo', correo: 'lector@demo.local', rol: 'lector', entidad: null },
  ];
  const sinClave = (fila: Fila): Usuario => ({
    id: fila.id,
    nombreCompleto: fila.nombreCompleto,
    correo: fila.correo,
    rol: fila.rol,
    entidad: fila.entidad,
    ultimoIngreso: fila.ultimoIngreso,
    debeCambiarContrasena: fila.debeCambiarContrasena,
    creadoEn: fila.creadoEn,
    actualizadoEn: fila.actualizadoEn,
  });
  const aCuenta = (fila: Fila | undefined): CuentaUsuario | null =>
    fila ? { id: fila.id, nombreCompleto: fila.nombreCompleto, correo: fila.correo, rol: fila.rol, entidad: fila.entidad, contrasenaCifrada: fila.contrasenaCifrada, debeCambiarContrasena: fila.debeCambiarContrasena } : null;
  const usuarios: UsuariosRepositoryPort = {
    listar: async ({ rol }) => filas.filter((f) => rol === undefined || f.rol === rol).map(sinClave),
    buscarPorId: async (id) => {
      const fila = filas.find((f) => f.id === id);
      return fila ? sinClave(fila) : null;
    },
    existeCorreo: async (correo, idExcluido) => filas.some((f) => f.correo === correo && f.id !== idExcluido),
    crear: async (nuevo: UsuarioParaGuardar) => {
      const fila: Fila = { ...nuevo, id: filas.length + 1, ultimoIngreso: null, creadoEn: FECHA, actualizadoEn: FECHA };
      filas.push(fila);
      return sinClave(fila);
    },
    actualizar: async (id, cambios: CambiosParaGuardar) => {
      const fila = filas.find((f) => f.id === id) as Fila;
      Object.assign(fila, Object.fromEntries(Object.entries(cambios).filter(([, valor]) => valor !== undefined)));
      return sinClave(fila);
    },
    eliminar: async (id) => {
      const posicion = filas.findIndex((f) => f.id === id);
      if (posicion === -1) return false;
      filas.splice(posicion, 1);
      return true;
    },
  };
  const cuentas: UsuarioRepositoryPort = {
    buscarPorCorreo: async (correo) => aCuenta(filas.find((f) => f.correo === correo)),
    buscarPorId: async (id) => aCuenta(filas.find((f) => f.id === id)),
    // Igual que el repositorio real: la contrasena que elige el propio usuario quita la marca
    cambiarContrasena: async (id, contrasenaCifrada) => {
      Object.assign(filas.find((f) => f.id === id) as Fila, { contrasenaCifrada, debeCambiarContrasena: false });
    },
    registrarIngreso: async (id) => {
      (filas.find((f) => f.id === id) as Fila).ultimoIngreso = new Date().toISOString();
    },
  };
  return { usuarios, cuentas };
}

// Enlaces de restablecimiento en memoria que vencen y sirven una vez
export function crearRestablecimientosFalsos(): RestablecimientosRepositoryPort {
  const enlaces = new Map<string, { usuarioId: number; venceEn: Date; usado: boolean }>();
  return {
    crear: async (usuarioId, venceEn) => {
      const token = `token-${enlaces.size + 1}`;
      enlaces.set(token, { usuarioId, venceEn, usado: false });
      return token;
    },
    consumir: async (token, ahora) => {
      const enlace = enlaces.get(token);
      if (enlace === undefined || enlace.usado || enlace.venceEn <= ahora) return null;
      enlace.usado = true;
      return enlace.usuarioId;
    },
  };
}

// Notificador que guarda los avisos para leer el token como si llegara al correo
export function crearNotificadorFalso(): NotificadorRestablecimientoPort & { avisos: AvisoRestablecimiento[] } {
  const avisos: AvisoRestablecimiento[] = [];
  return { avisos, enviar: async (aviso) => void avisos.push(aviso) };
}
