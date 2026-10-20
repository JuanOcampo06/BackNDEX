import { Pool } from 'pg';

// Crea el grupo de conexiones a PostgreSQL con la url de la variable DATABASE_URL
// no se conecta hasta la primera consulta asi que la api arranca aunque la base no este lista
export function crearPoolPostgres(): Pool {
  return new Pool({ connectionString: process.env.DATABASE_URL });
}
