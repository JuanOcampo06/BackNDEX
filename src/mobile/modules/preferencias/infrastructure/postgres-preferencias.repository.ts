import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { crearPoolPostgres } from '../../../../platform/database/postgres';
import { PreferenciasRepositoryPort } from '../application/preferencias.repository.port';
import { Avatar, DistanciaAlertaM, Preferencias, Tema } from '../domain/preferencias';

// Los si o no se guardan como el texto 'true' o 'false' igual que en movil.usuarios para que se lean completos en Adminer
type TextoSiNo = 'true' | 'false';

interface FilaPreferencias {
  tema: Tema;
  avatar: Avatar;
  reportes_cercanos: TextoSiNo;
  sonido: TextoSiNo;
  vibracion: TextoSiNo;
  distancia_alerta_m: DistanciaAlertaM;
  voz: TextoSiNo;
  notificaciones_ruta: TextoSiNo;
}

// Solo guarda si el ciudadano existe: si no, no inserta nada y el caso de uso responde que no existe
const GUARDAR = `
  INSERT INTO movil.preferencias (usuario_id, tema, avatar, reportes_cercanos, sonido, vibracion, distancia_alerta_m, voz, notificaciones_ruta)
  SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
  WHERE EXISTS (SELECT 1 FROM movil.usuarios WHERE id = $1)
  ON CONFLICT (usuario_id) DO UPDATE SET
    tema = EXCLUDED.tema,
    avatar = EXCLUDED.avatar,
    reportes_cercanos = EXCLUDED.reportes_cercanos,
    sonido = EXCLUDED.sonido,
    vibracion = EXCLUDED.vibracion,
    distancia_alerta_m = EXCLUDED.distancia_alerta_m,
    voz = EXCLUDED.voz,
    notificaciones_ruta = EXCLUDED.notificaciones_ruta,
    actualizado_en = now()`;

// Guarda y lee las preferencias de cada ciudadano en movil.preferencias (una fila por ciudadano)
@Injectable()
export class PostgresPreferenciasRepository implements PreferenciasRepositoryPort, OnModuleDestroy {
  private readonly pool = crearPoolPostgres();

  // Cierra las conexiones cuando la api se apaga
  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async buscar(usuarioId: number): Promise<Preferencias | null> {
    const resultado = await this.pool.query<FilaPreferencias>(
      'SELECT tema, avatar, reportes_cercanos, sonido, vibracion, distancia_alerta_m, voz, notificaciones_ruta FROM movil.preferencias WHERE usuario_id = $1',
      [usuarioId],
    );
    return resultado.rows.length > 0 ? aPreferencias(resultado.rows[0]) : null;
  }

  async guardar(usuarioId: number, p: Preferencias): Promise<boolean> {
    const resultado = await this.pool.query(GUARDAR, [
      usuarioId,
      p.tema,
      p.avatar,
      aTexto(p.alertas.reportesCercanos),
      aTexto(p.alertas.sonido),
      aTexto(p.alertas.vibracion),
      p.alertas.distanciaM,
      aTexto(p.voz),
      aTexto(p.notificacionesRuta),
    ]);
    return (resultado.rowCount ?? 0) > 0;
  }
}

function aPreferencias(fila: FilaPreferencias): Preferencias {
  return {
    tema: fila.tema,
    avatar: fila.avatar,
    alertas: {
      reportesCercanos: fila.reportes_cercanos === 'true',
      sonido: fila.sonido === 'true',
      vibracion: fila.vibracion === 'true',
      distanciaM: fila.distancia_alerta_m,
    },
    voz: fila.voz === 'true',
    notificacionesRuta: fila.notificaciones_ruta === 'true',
  };
}

function aTexto(valor: boolean): TextoSiNo {
  return valor ? 'true' : 'false';
}
