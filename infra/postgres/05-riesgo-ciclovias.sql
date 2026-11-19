-- Calcula compartido.ciclovias.riesgo con los siniestros del Anuario de Siniestralidad Vial
-- el riesgo no se muestra en el mapa: solo lo usan las rutas para que la ruta segura esquive los tramos con mas siniestros
-- Docker lo ejecuta solo la primera vez y se puede volver a correr cuando cambien los siniestros o las ciclovias
-- tambien hay que volver a correrlo despues de 03-ciclovias.sql porque ese script vuelve a crear la tabla y borra el riesgo
--
-- Como se calcula:
-- 1. un siniestro cuenta para una via si ocurrio a 40 metros o menos de alguno de sus tramos
-- 2. pesa 1 y se multiplica por 2 si hubo una bicicleta y por 3 si hubo muertos
-- 3. el puntaje de la via son esos pesos por cada kilometro (una via de menos de 200 metros se mide como de 200)
-- 4. sin siniestros cerca es bajo y entre las que si tienen el 40% mas alto es medio y el 15% mas alto es alto

SET client_min_messages = warning;

-- Metros por grado en Bogota con una proyeccion plana que sirve para distancias cortas y el radio de cercania
CREATE TEMP TABLE constantes AS SELECT 110800.0::double precision AS m_por_grado, 40.0::double precision AS radio_m;

-- Cada tramo entre dos puntos seguidos de la via
CREATE TEMP TABLE tramos AS
SELECT via_id, lat_a, lon_a, lat_b, lon_b
FROM (
  SELECT via_id, lat AS lat_a, lon AS lon_a,
         lead(lat) OVER (PARTITION BY via_id ORDER BY orden) AS lat_b,
         lead(lon) OVER (PARTITION BY via_id ORDER BY orden) AS lon_b
  FROM (
    SELECT v.id AS via_id, (p ->> 0)::double precision AS lat, (p ->> 1)::double precision AS lon, orden
    FROM compartido.ciclovias AS v
    CROSS JOIN jsonb_array_elements(v.coordenadas) WITH ORDINALITY AS t (p, orden)
  ) AS puntos
) AS pares
WHERE lat_b IS NOT NULL;

-- Siniestros con su peso
CREATE TEMP TABLE siniestros_peso AS
SELECT latitud, longitud, id,
       (CASE WHEN tipo_vehiculo = 'bicicleta' THEN 2 ELSE 1 END) * (CASE WHEN gravedad = 'con_muertos' THEN 3 ELSE 1 END) AS peso
FROM dashboard.siniestros;
CREATE INDEX ON siniestros_peso (latitud);

-- Pares via y siniestro a 40 metros o menos de algun tramo y cada siniestro cuenta una vez por via
-- la distancia se mide proyectando el siniestro sobre el tramo y limitando la proyeccion entre sus extremos
CREATE TEMP TABLE cercanos AS
SELECT DISTINCT t.via_id, s.id AS siniestro_id, s.peso
FROM tramos AS t
CROSS JOIN constantes AS c
JOIN siniestros_peso AS s
  ON s.latitud BETWEEN least(t.lat_a, t.lat_b) - c.radio_m / c.m_por_grado AND greatest(t.lat_a, t.lat_b) + c.radio_m / c.m_por_grado
 AND s.longitud BETWEEN least(t.lon_a, t.lon_b) - c.radio_m / c.m_por_grado AND greatest(t.lon_a, t.lon_b) + c.radio_m / c.m_por_grado
CROSS JOIN LATERAL (
  SELECT (t.lat_b - t.lat_a) AS dy, (t.lon_b - t.lon_a) AS dx, (s.latitud - t.lat_a) AS py, (s.longitud - t.lon_a) AS px
) AS d
CROSS JOIN LATERAL (
  SELECT CASE WHEN d.dx = 0 AND d.dy = 0 THEN 0
              ELSE greatest(0, least(1, (d.px * d.dx + d.py * d.dy) / (d.dx * d.dx + d.dy * d.dy))) END AS u
) AS k
WHERE sqrt(power(d.px - k.u * d.dx, 2) + power(d.py - k.u * d.dy, 2)) * c.m_por_grado <= c.radio_m;

-- Largo de cada via en kilometros
CREATE TEMP TABLE largos AS
SELECT t.via_id, sum(sqrt(power(t.lat_b - t.lat_a, 2) + power(t.lon_b - t.lon_a, 2)) * c.m_por_grado) / 1000.0 AS km
FROM tramos AS t CROSS JOIN constantes AS c
GROUP BY t.via_id;

CREATE TEMP TABLE puntajes AS
SELECT v.id AS via_id,
       coalesce(sum(cer.peso), 0) / greatest(coalesce(l.km, 0), 0.2) AS puntaje
FROM compartido.ciclovias AS v
LEFT JOIN largos AS l ON l.via_id = v.id
LEFT JOIN cercanos AS cer ON cer.via_id = v.id
GROUP BY v.id, l.km;

WITH cortes AS (
  SELECT percentile_cont(0.60) WITHIN GROUP (ORDER BY puntaje) AS medio,
         percentile_cont(0.85) WITHIN GROUP (ORDER BY puntaje) AS alto
  FROM puntajes WHERE puntaje > 0
)
UPDATE compartido.ciclovias AS v
SET riesgo = CASE
  WHEN p.puntaje = 0 THEN 'bajo'
  WHEN p.puntaje >= c.alto THEN 'alto'
  WHEN p.puntaje >= c.medio THEN 'medio'
  ELSE 'bajo'
END
FROM puntajes AS p, cortes AS c
WHERE p.via_id = v.id;
