import { readFileSync } from 'node:fs';
import { Pool, PoolConfig } from 'pg';

type Entorno = Record<string, string | undefined>;

// Crea el grupo de conexiones a PostgreSQL con la url de la variable DATABASE_URL
// no se conecta hasta la primera consulta asi que la api arranca aunque la base no este lista
export function crearPoolPostgres(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL, ssl: opcionesSsl(process.env) });
}

// La conexion va cifrada con TLS y verificando el certificado del servidor salvo que DATABASE_SSL sea false
// false es solo para el postgres local de docker que no tiene TLS
// DATABASE_SSL_CA es la ruta al certificado de la autoridad que firmo el del servidor
// en RDS es el global-bundle.pem de AWS porque Node no lo trae entre sus certificados de confianza
export function opcionesSsl(entorno: Entorno): PoolConfig['ssl'] {
  if (entorno.DATABASE_SSL === 'false') {
    return false;
  }
  const rutaCa = entorno.DATABASE_SSL_CA;
  return rutaCa ? { rejectUnauthorized: true, ca: readFileSync(rutaCa, 'utf8') } : { rejectUnauthorized: true };
}
