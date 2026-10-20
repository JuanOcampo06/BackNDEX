-- Datos de prueba para que todas las graficas y tarjetas del tablero muestren algo
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

INSERT INTO localidades (nombre) VALUES
  ('Usaquen'), ('Chapinero'), ('Teusaquillo'), ('Engativa'),
  ('Suba'), ('Kennedy'), ('Fontibon'), ('Bosa');

-- El orden importa porque los primeros lugares reciben mas eventos
INSERT INTO lugares (nombre, localidad_id, latitud, longitud)
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
JOIN localidades l ON l.nombre = v.localidad
ORDER BY v.orden;

-- Trazados aproximados de algunas ciclorutas de la ciudad
INSERT INTO ciclorutas (nombre, riesgo, trazado) VALUES
  ('Cicloruta Calle 80', 'alto', '[[4.6880, -74.0620], [4.6960, -74.0800], [4.7005, -74.0905], [4.7090, -74.1100], [4.7180, -74.1250]]'),
  ('Cicloruta Av. Americas', 'alto', '[[4.6200, -74.0900], [4.6260, -74.1050], [4.6300, -74.1170], [4.6380, -74.1400], [4.6450, -74.1600]]'),
  ('Cicloruta Av. Boyaca', 'medio', '[[4.6070, -74.1340], [4.6420, -74.1220], [4.6680, -74.1110], [4.7005, -74.0905], [4.7330, -74.0780]]'),
  ('Cicloruta Calle 26', 'bajo', '[[4.6150, -74.0700], [4.6300, -74.0780], [4.6380, -74.0820], [4.6550, -74.1000], [4.6680, -74.1110]]'),
  ('Cicloruta Cra. 7', 'medio', '[[4.6100, -74.0700], [4.6350, -74.0640], [4.6560, -74.0560], [4.6860, -74.0420], [4.7100, -74.0330]]'),
  ('Cicloruta Autonorte', 'bajo', '[[4.6860, -74.0560], [4.7130, -74.0520], [4.7350, -74.0480], [4.7550, -74.0450]]'),
  ('Cicloruta Autopista Sur', 'alto', '[[4.6000, -74.1200], [4.6050, -74.1500], [4.6100, -74.1850]]');

-- Entre 10 y 17 siniestros por dia con mas casos en horas pico
-- el anio actual tiene un poco mas de casos que el anterior
INSERT INTO siniestros (ocurrido_en, lugar_id, latitud, longitud, gravedad, clase, tipo_vehiculo, sexo, edad)
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
    1 + floor(power(random(), 1.3) * (SELECT count(*) FROM lugares))::int AS lugar_id,
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
JOIN lugares lu ON lu.id = e.lugar_id;

-- Conteo diario de usuarios que crece poco a poco con el tiempo
-- las camaras cuentan mas usuarios que la app
INSERT INTO conteos_usuarios (fecha, localidad_id, tipo_vehiculo, fuente, cantidad)
SELECT
  dia::date,
  lo.id,
  t.tipo_vehiculo,
  f.fuente,
  round(35 * (1 + lo.id % 3 * 0.3) * t.peso * f.peso * (1 + (dia::date - rango.inicio) / 1000.0) * (0.8 + random() * 0.4))::int
FROM rango
CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
CROSS JOIN localidades lo
CROSS JOIN (VALUES
  ('bicicleta', 0.65), ('bicicleta_electrica', 0.185), ('patineta_electrica', 0.127), ('patineta', 0.028), ('otro', 0.012)
) AS t (tipo_vehiculo, peso)
CROSS JOIN (VALUES ('camaras', 1.0), ('app', 0.4)) AS f (fuente, peso);

-- Unos 30 reportes por dia y cerca del 8 por ciento termina como falso positivo
INSERT INTO reportes (creado_en, lugar_id, latitud, longitud, categoria, motivo_falso_positivo)
SELECT
  e.creado_en,
  lu.id,
  lu.latitud + (random() - 0.5) * 0.03,
  lu.longitud + (random() - 0.5) * 0.03,
  e.categoria,
  CASE WHEN random() < 0.078 THEN pg_temp.elegir(
    ARRAY['duplicado', 'ubicacion_incorrecta', 'descartado_por_la_comunidad', 'no_corresponde_a_la_categoria'],
    ARRAY[38, 27, 22, 13]
  ) END
FROM (
  SELECT
    dia + make_interval(secs => floor(random() * 86400)::int) AS creado_en,
    1 + floor(random() * (SELECT count(*) FROM lugares))::int AS lugar_id,
    pg_temp.elegir(
      ARRAY['via_en_mal_estado', 'poca_iluminacion', 'obstaculo_en_cicloruta', 'conductor_imprudente', 'hurto_o_inseguridad'],
      ARRAY[30, 22, 18, 17, 13]
    ) AS categoria
  FROM rango
  CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
  CROSS JOIN LATERAL generate_series(1, ((24 + random() * 8) * (1 + (dia::date - rango.inicio) / 1500.0))::int) AS caso
) AS e
JOIN lugares lu ON lu.id = e.lugar_id;

-- Entre 2 y 6 activaciones del boton de panico por dia y una mas los fines de semana
INSERT INTO activaciones_panico (activado_en, lugar_id, latitud, longitud)
SELECT e.activado_en, lu.id, lu.latitud + (random() - 0.5) * 0.002, lu.longitud + (random() - 0.5) * 0.002
FROM (
  SELECT
    dia + make_interval(secs => floor(random() * 86400)::int) AS activado_en,
    1 + floor(power(random(), 1.5) * (SELECT count(*) FROM lugares))::int AS lugar_id
  FROM rango
  CROSS JOIN generate_series(rango.inicio, rango.fin, interval '1 day') AS dia
  CROSS JOIN LATERAL generate_series(1, (2 + random() * 4 + (extract(isodow FROM dia) >= 6)::int)::int) AS caso
) AS e
JOIN lugares lu ON lu.id = e.lugar_id;
