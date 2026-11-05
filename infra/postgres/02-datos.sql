-- Datos de prueba para que la app y todas las graficas y tarjetas del tablero muestren algo
-- Las fechas se generan desde el primero de enero del anio pasado hasta hoy
-- asi el filtro de los ultimos tres meses y la comparacion entre anios siempre tienen datos

-- Semilla fija para que los datos aleatorios salgan iguales en cada maquina
SELECT setseed(0.2026);

-- Rango de fechas que se llena con datos
CREATE TEMP TABLE rango AS
SELECT (date_trunc('year', current_date) - interval '1 year')::date AS inicio, current_date AS fin;

-- Elige una opcion al azar respetando el peso de cada una
CREATE FUNCTION pg_temp.elegir(opciones text[], pesos numeric[]) RETURNS text AS $$
DECLARE
  objetivo numeric := random() * (SELECT sum(peso) FROM unnest(pesos) AS peso);
  acumulado numeric := 0;
BEGIN
  FOR i IN 1 .. cardinality(opciones) LOOP
    acumulado := acumulado + pesos[i];
    IF objetivo < acumulado THEN
      RETURN opciones[i];
    END IF;
  END LOOP;
  RETURN opciones[cardinality(opciones)];
END
$$ LANGUAGE plpgsql;

-- ============================== compartido: localidades y lugares ==============================

INSERT INTO compartido.localidades (nombre) VALUES
  ('Usaquen'), ('Chapinero'), ('Teusaquillo'), ('Engativa'),
  ('Suba'), ('Kennedy'), ('Fontibon'), ('Bosa');

-- El orden importa porque los primeros lugares reciben mas eventos
INSERT INTO compartido.lugares (nombre, localidad_id, latitud, longitud)
SELECT v.nombre, l.id, v.latitud, v.longitud
FROM (VALUES
  (1, 'Av. Boyaca x Calle 80', 'Engativa', 4.7005, -74.0905),
  (2, 'Av. Americas x Cra. 68', 'Kennedy', 4.6300, -74.1170),
  (3, 'Calle 26 x Cra. 30', 'Teusaquillo', 4.6380, -74.0820),
  (4, 'Av. Cali x Calle 13', 'Kennedy', 4.6530, -74.1460),
  (5, 'Autonorte x Calle 170', 'Usaquen', 4.7550, -74.0450),
  (6, 'Cra. 7 x Calle 72', 'Chapinero', 4.6560, -74.0560),
  (7, 'Av. Suba x Calle 127', 'Suba', 4.7130, -74.0700),
  (8, 'Av. El Dorado x Av. Boyaca', 'Fontibon', 4.6680, -74.1110),
  (9, 'Av. Primero de Mayo x Av. Boyaca', 'Kennedy', 4.6070, -74.1340),
  (10, 'Autopista Sur x Av. Bosa', 'Bosa', 4.6100, -74.1850),
  (11, 'Cra. 15 x Calle 100', 'Chapinero', 4.6860, -74.0480),
  (12, 'Av. Ciudad de Cali x Calle 80', 'Engativa', 4.7090, -74.1100),
  (13, 'Calle 53 x Cra. 30', 'Teusaquillo', 4.6470, -74.0780),
  (14, 'Av. Suba x Calle 145', 'Suba', 4.7330, -74.0780),
  (15, 'Calle 13 x Av. Boyaca', 'Fontibon', 4.6420, -74.1220)
) AS v (orden, nombre, localidad, latitud, longitud)
JOIN compartido.localidades l ON l.nombre = v.localidad
ORDER BY v.orden;

-- ============================== movil: ciudadanos de ejemplo de la app ==============================
-- Van primero para que sus ids sean 1 2 y 3 y sirvan en los ejemplos de la documentacion

INSERT INTO movil.usuarios (nombre_completo, correo, telefono) VALUES
  ('Camila Rojas', 'camila.rojas@demo.local', '3001112233'),
  ('Andres Gomez', 'andres.gomez@demo.local', '3004445566'),
  ('Laura Martinez', 'laura.martinez@demo.local', NULL);

-- Reportes y activaciones de ejemplo de esos ciudadanos con ids 1 a 5 y 1 a 3
-- el lugar se calcula igual que cuando la app crea uno nuevo
INSERT INTO compartido.reportes (usuario_id, lugar_id, categoria, descripcion, latitud, longitud, estado, motivo_falso_positivo, creado_en)
SELECT v.usuario_id, compartido.lugar_mas_cercano(v.latitud, v.longitud), v.categoria, v.descripcion, v.latitud, v.longitud, v.estado, v.motivo, v.creado_en
FROM (VALUES
  (1, 1, 'via_en_mal_estado', 'Hueco grande en la ciclorruta', 4.6486, -74.0818, 'recibido', NULL, now() - interval '6 days'),
  (2, 1, 'poca_iluminacion', 'El poste de la esquina no funciona', 4.6380, -74.0820, 'en_revision', NULL, now() - interval '4 days'),
  (3, 2, 'obstaculo_en_cicloruta', 'Carro parqueado sobre la ciclorruta', 4.7005, -74.0905, 'resuelto', NULL, now() - interval '3 days'),
  (4, 2, 'conductor_imprudente', NULL, 4.6300, -74.1170, 'recibido', NULL, now() - interval '2 days'),
  (5, 3, 'hurto_o_inseguridad', 'Zona sin vigilancia en la noche', 4.7550, -74.0450, 'descartado', 'descartado_por_la_comunidad', now() - interval '1 day')
) AS v (orden, usuario_id, categoria, descripcion, latitud, longitud, estado, motivo, creado_en)
ORDER BY v.orden;

INSERT INTO compartido.activaciones_panico (usuario_id, lugar_id, latitud, longitud, estado, activado_en)
SELECT v.usuario_id, compartido.lugar_mas_cercano(v.latitud, v.longitud), v.latitud, v.longitud, v.estado, v.activado_en
FROM (VALUES
  (1, 1, 4.6486, -74.0818, 'atendida', now() - interval '5 days'),
  (2, 2, 4.6530, -74.1460, 'cancelada', now() - interval '2 days'),
  (3, 3, 4.7550, -74.0450, 'activa', now() - interval '1 hour')
) AS v (orden, usuario_id, latitud, longitud, estado, activado_en)
ORDER BY v.orden;

-- Mas ciudadanos de prueba que son los autores del historial de reportes y activaciones
INSERT INTO movil.usuarios (nombre_completo, correo)
SELECT 'Ciudadano de prueba ' || n, 'ciudadano' || n || '@demo.local'
FROM generate_series(1, 300) AS n;

-- ============================== dashboard: siniestros y conteos ==============================

-- Entre 10 y 17 siniestros por dia con mas casos en horas pico
-- el anio actual tiene un poco mas de casos que el anterior
INSERT INTO dashboard.siniestros (ocurrido_en, lugar_id, latitud, longitud, gravedad, clase, tipo_vehiculo, sexo, edad)
SELECT
  e.ocurrido_en,
  lu.id,
  lu.latitud + (random() - 0.5) * 0.01,
  lu.longitud + (random() - 0.5) * 0.01,
  e.gravedad,
  e.clase,
  e.tipo_vehiculo,
  CASE WHEN e.gravedad <> 'solo_danos' THEN pg_temp.elegir(ARRAY['hombre', 'mujer'], ARRAY[70, 30]) END,
  CASE WHEN e.gravedad <> 'solo_danos' THEN greatest(8, least(80, round(32 + (random() + random() + random() - 1.5) * 28)))::int END
FROM (
  SELECT
    dia + make_interval(
      hours => pg_temp.elegir(
        ARRAY(SELECT generate_series(0, 23)::text),
        ARRAY[1, 1, 1, 1, 2, 4, 8, 12, 11, 7, 5, 5, 6, 6, 5, 5, 7, 11, 13, 11, 7, 5, 3, 2]
      )::int,
      mins => floor(random() * 60)::int
    ) AS ocurrido_en,
    1 + floor(power(random(), 1.3) * (SELECT count(*) FROM compartido.lugares))::int AS lugar_id,
    pg_temp.elegir(ARRAY['con_muertos', 'con_heridos', 'solo_danos'], ARRAY[2, 64, 34]) AS gravedad,
    pg_temp.elegir(ARRAY['choque', 'atropello', 'caida', 'volcamiento', 'otro'], ARRAY[50, 15, 25, 5, 5]) AS clase,
    pg_temp.elegir(
      ARRAY['bicicleta', 'bicicleta_electrica', 'patineta_electrica', 'patineta', 'otro'],
      ARRAY[60, 18, 14, 5, 3]
    ) AS tipo_vehiculo
  FROM rango
  CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
  CROSS JOIN LATERAL generate_series(
    1,
    ((10 + 3 * sin(extract(month FROM dia))) * (1 + 0.06 * (extract(year FROM dia) - extract(year FROM rango.inicio))) + random() * 4)::int
  ) AS caso
) AS e
JOIN compartido.lugares lu ON lu.id = e.lugar_id;

-- Conteo diario de usuarios que crece poco a poco con el tiempo
-- la app es la unica fuente y su peso suma lo que antes sumaban las dos fuentes asi las cifras se mantienen parecidas
INSERT INTO dashboard.conteos_usuarios (fecha, localidad_id, tipo_vehiculo, fuente, cantidad)
SELECT
  dia::date,
  lo.id,
  t.tipo_vehiculo,
  f.fuente,
  round(35 * (1 + lo.id % 3 * 0.3) * t.peso * f.peso * (1 + (dia::date - rango.inicio) / 1000.0) * (0.8 + random() * 0.4))::int
FROM rango
CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
CROSS JOIN compartido.localidades lo
CROSS JOIN (VALUES
  ('bicicleta', 0.65), ('bicicleta_electrica', 0.185), ('patineta_electrica', 0.127), ('patineta', 0.028), ('otro', 0.012)
) AS t (tipo_vehiculo, peso)
CROSS JOIN (VALUES ('app', 1.4)) AS f (fuente, peso);

-- ============================== compartido: historial de reportes y activaciones ==============================

-- Unos 30 reportes por dia hechos por ciudadanos al azar
-- cerca del 8 por ciento termina descartado como falso positivo y los demas avanzan de estado con el tiempo
INSERT INTO compartido.reportes (usuario_id, lugar_id, categoria, latitud, longitud, estado, motivo_falso_positivo, creado_en)
SELECT
  e.usuario_id,
  lu.id,
  e.categoria,
  lu.latitud + (random() - 0.5) * 0.03,
  lu.longitud + (random() - 0.5) * 0.03,
  CASE
    WHEN e.motivo IS NOT NULL THEN 'descartado'
    WHEN e.creado_en < current_date - interval '14 days' THEN 'resuelto'
    ELSE pg_temp.elegir(ARRAY['recibido', 'en_revision'], ARRAY[1, 1])
  END,
  e.motivo,
  e.creado_en
FROM (
  SELECT
    dia + make_interval(secs => floor(random() * 86400)::int) AS creado_en,
    1 + floor(random() * (SELECT count(*) FROM compartido.lugares))::int AS lugar_id,
    1 + floor(random() * (SELECT count(*) FROM movil.usuarios))::int AS usuario_id,
    pg_temp.elegir(
      ARRAY['via_en_mal_estado', 'poca_iluminacion', 'obstaculo_en_cicloruta', 'conductor_imprudente', 'hurto_o_inseguridad'],
      ARRAY[30, 22, 18, 17, 13]
    ) AS categoria,
    CASE WHEN random() < 0.078 THEN pg_temp.elegir(
      ARRAY['duplicado', 'ubicacion_incorrecta', 'descartado_por_la_comunidad', 'no_corresponde_a_la_categoria'],
      ARRAY[38, 27, 22, 13]
    ) END AS motivo
  FROM rango
  CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
  CROSS JOIN LATERAL generate_series(1, ((24 + random() * 8) * (1 + (dia::date - rango.inicio) / 1500.0))::int) AS caso
) AS e
JOIN compartido.lugares lu ON lu.id = e.lugar_id;

-- Entre 2 y 6 activaciones del boton de panico por dia y una mas los fines de semana
-- las del historial ya fueron atendidas o canceladas por el ciudadano
INSERT INTO compartido.activaciones_panico (usuario_id, lugar_id, latitud, longitud, estado, activado_en)
SELECT
  e.usuario_id,
  lu.id,
  lu.latitud + (random() - 0.5) * 0.002,
  lu.longitud + (random() - 0.5) * 0.002,
  pg_temp.elegir(ARRAY['atendida', 'cancelada'], ARRAY[85, 15]),
  e.activado_en
FROM (
  SELECT
    dia + make_interval(secs => floor(random() * 86400)::int) AS activado_en,
    1 + floor(power(random(), 1.5) * (SELECT count(*) FROM compartido.lugares))::int AS lugar_id,
    1 + floor(random() * (SELECT count(*) FROM movil.usuarios))::int AS usuario_id
  FROM rango
  CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
  CROSS JOIN LATERAL generate_series(1, (2 + random() * 4 + (extract(isodow FROM dia) >= 6)::int)::int) AS caso
) AS e
JOIN compartido.lugares lu ON lu.id = e.lugar_id;

-- ============================== dashboard: usuarios ==============================

INSERT INTO dashboard.usuarios (nombre_completo, correo, rol) VALUES
  ('Admin Demo', 'admin@demo.local', 'admin'),
  ('Laura Gomez', 'laura.gomez@demo.local', 'admin'),
  ('Carlos Perez', 'carlos.perez@demo.local', 'lector');
