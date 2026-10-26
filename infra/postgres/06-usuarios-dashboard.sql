-- Usuarios del dashboard institucional con su rol
-- admin puede crear editar y eliminar usuarios y lector solo puede ver la informacion
-- no tiene que ver con movil.usuarios que son los ciudadanos de la app
-- Docker lo ejecuta solo la primera vez y tambien se puede volver a correr sin borrar nada
-- porque solo crea lo que falta

-- La contrasena se agregara cuando exista el login real con JWT
CREATE TABLE IF NOT EXISTS usuarios_dashboard (
  id serial PRIMARY KEY,
  nombre_completo text NOT NULL CHECK (char_length(nombre_completo) BETWEEN 1 AND 120),
  correo text NOT NULL UNIQUE,
  rol text NOT NULL DEFAULT 'lector' CHECK (rol IN ('admin', 'lector')),
  creado_en timestamptz NOT NULL DEFAULT now(),
  actualizado_en timestamptz NOT NULL DEFAULT now()
);

-- Usuarios de prueba y si ya existen no se duplican
INSERT INTO usuarios_dashboard (nombre_completo, correo, rol) VALUES
  ('Admin Demo', 'admin@demo.local', 'admin'),
  ('Laura Gomez', 'laura.gomez@demo.local', 'admin'),
  ('Carlos Perez', 'carlos.perez@demo.local', 'lector')
ON CONFLICT (correo) DO NOTHING;
