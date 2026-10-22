-- Ciclovias reales de OpenStreetMap que usan el dashboard y la app movil
-- Docker lo ejecuta solo la primera vez y tambien se puede volver a correr para cargar un JSON nuevo
-- porque borra y vuelve a crear sus dos tablas sin tocar las demas

-- Carpeta donde esta este script dentro del contenedor y fuera de docker se cambia con psql -v carpeta=infra/postgres
\if :{?carpeta}
\else
  \set carpeta /docker-entrypoint-initdb.d
\endif

-- Oculta los avisos de postgres cuando las tablas todavia no existen
SET client_min_messages = warning;

DROP TABLE IF EXISTS ciclovias;
DROP TABLE IF EXISTS ciclovias_fuente;

-- Archivo JSON completo tal como lo entrega OpenStreetMap
CREATE TABLE ciclovias_fuente (
  id serial PRIMARY KEY,
  fecha_datos timestamptz,
  cargado_en timestamptz NOT NULL DEFAULT now(),
  contenido jsonb NOT NULL
);

-- Una fila por cada via del JSON lista para buscar por zona del mapa
-- coordenadas es una lista de puntos con forma de latitud y longitud
-- riesgo queda vacio hasta que se calcule y min y max forman el rectangulo que contiene la via
CREATE TABLE ciclovias (
  id bigint PRIMARY KEY,
  fuente_id int NOT NULL REFERENCES ciclovias_fuente (id),
  tipo text NOT NULL CHECK (tipo IN ('ciclovia', 'cruce')),
  nombre text,
  riesgo text CHECK (riesgo IN ('bajo', 'medio', 'alto')),
  etiquetas jsonb NOT NULL,
  nodos bigint[] NOT NULL,
  coordenadas jsonb NOT NULL,
  min_lat double precision NOT NULL,
  min_lon double precision NOT NULL,
  max_lat double precision NOT NULL,
  max_lon double precision NOT NULL
);

-- Indice para encontrar rapido las vias que caen dentro de la zona que se ve en el mapa
CREATE INDEX ciclovias_zona_idx ON ciclovias (min_lat, max_lat, min_lon, max_lon);

-- Se lee el archivo linea por linea y luego se une en un solo JSON
-- los separadores raros evitan que postgres intente partir las lineas en columnas
CREATE TEMP TABLE lineas_json (numero serial, linea text);
-- copy no acepta variables en la ruta por eso primero se entra a la carpeta
\cd :carpeta
\copy lineas_json (linea) FROM 'datos/ciclovias-osm.json' WITH (FORMAT csv, DELIMITER E'\x02', QUOTE E'\x01', ENCODING 'UTF8')

INSERT INTO ciclovias_fuente (fecha_datos, contenido)
SELECT (archivo.contenido -> 'osm3s' ->> 'timestamp_osm_base')::timestamptz, archivo.contenido
FROM (
  SELECT string_agg(coalesce(linea, ''), E'\n' ORDER BY numero)::jsonb AS contenido FROM lineas_json
) AS archivo;

-- Cada via se vuelve una fila y es cruce cuando OpenStreetMap la marca con la etiqueta crossing
INSERT INTO ciclovias (id, fuente_id, tipo, nombre, etiquetas, nodos, coordenadas, min_lat, min_lon, max_lat, max_lon)
SELECT
  (via ->> 'id')::bigint,
  fuente.id,
  CASE
    WHEN via -> 'tags' ->> 'cycleway' = 'crossing' OR via -> 'tags' ? 'crossing' THEN 'cruce'
    ELSE 'ciclovia'
  END,
  via -> 'tags' ->> 'name',
  coalesce(via -> 'tags', '{}'),
  ARRAY(
    SELECT nodo::bigint
    FROM jsonb_array_elements_text(via -> 'nodes') WITH ORDINALITY AS n (nodo, orden)
    ORDER BY orden
  ),
  (
    SELECT jsonb_agg(jsonb_build_array(punto -> 'lat', punto -> 'lon') ORDER BY orden)
    FROM jsonb_array_elements(via -> 'geometry') WITH ORDINALITY AS g (punto, orden)
  ),
  (via -> 'bounds' ->> 'minlat')::double precision,
  (via -> 'bounds' ->> 'minlon')::double precision,
  (via -> 'bounds' ->> 'maxlat')::double precision,
  (via -> 'bounds' ->> 'maxlon')::double precision
FROM ciclovias_fuente AS fuente
CROSS JOIN jsonb_array_elements(fuente.contenido -> 'elements') AS via
WHERE via ->> 'type' = 'way';
