-- Semaforos sobre las ciclorrutas de OpenStreetMap que la app movil dibuja en el mapa
-- son solo de la app y por eso viven en el schema movil
-- Docker lo ejecuta solo la primera vez y tambien se puede volver a correr para cargar un JSON nuevo
-- porque borra y vuelve a crear su tabla sin tocar las demas

-- Carpeta donde esta este script dentro del contenedor y fuera de docker se cambia con psql -v carpeta=infra/postgres
\if :{?carpeta}
\else
  \set carpeta /docker-entrypoint-initdb.d
\endif

SET client_min_messages = warning;

DROP TABLE IF EXISTS movil.semaforos;

-- id es el de OpenStreetMap
-- el JSON tambien dice si tiene luz para ciclistas o boton, pero casi siempre viene vacio o en falso y no se guarda
CREATE TABLE movil.semaforos (
  id bigint PRIMARY KEY,
  latitud double precision NOT NULL CHECK (latitud BETWEEN -90 AND 90),
  longitud double precision NOT NULL CHECK (longitud BETWEEN -180 AND 180)
);

-- Indice para encontrar rapido los semaforos que caen dentro de la zona que se ve en el mapa
CREATE INDEX semaforos_zona_idx ON movil.semaforos (latitud, longitud);

-- Se lee el archivo linea por linea y luego se une en un solo JSON
-- los separadores raros evitan que postgres intente partir las lineas en columnas
CREATE TEMP TABLE lineas_json (numero serial, linea text);
-- copy no acepta variables en la ruta por eso primero se entra a la carpeta
\cd :carpeta
\copy lineas_json (linea) FROM 'datos/semaforos-osm.json' WITH (FORMAT csv, DELIMITER E'\x02', QUOTE E'\x01', ENCODING 'UTF8')

INSERT INTO movil.semaforos (id, latitud, longitud)
SELECT
  (senal ->> 'id')::bigint,
  (senal ->> 'lat')::double precision,
  (senal ->> 'lng')::double precision
FROM (
  SELECT string_agg(coalesce(linea, ''), E'\n' ORDER BY numero)::jsonb AS contenido FROM lineas_json
) AS archivo
CROSS JOIN jsonb_array_elements(archivo.contenido -> 'signals') AS senal;
