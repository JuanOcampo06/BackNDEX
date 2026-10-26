-- Datos de prueba de la app movil para poder probar sus endpoints
-- los ids de los ciudadanos son 1 2 y 3

INSERT INTO movil.usuarios (nombre_completo, correo, telefono) VALUES
  ('Camila Rojas', 'camila.rojas@demo.local', '3001112233'),
  ('Andres Gomez', 'andres.gomez@demo.local', '3004445566'),
  ('Laura Martinez', 'laura.martinez@demo.local', NULL);

INSERT INTO movil.reportes (usuario_id, categoria, descripcion, latitud, longitud, estado, creado_en) VALUES
  (1, 'via_en_mal_estado', 'Hueco grande en la ciclorruta', 4.6486, -74.0818, 'recibido', now() - interval '6 days'),
  (1, 'poca_iluminacion', 'El poste de la esquina no funciona', 4.6380, -74.0820, 'en_revision', now() - interval '4 days'),
  (2, 'obstaculo_en_cicloruta', 'Carro parqueado sobre la ciclorruta', 4.7005, -74.0905, 'resuelto', now() - interval '3 days'),
  (2, 'conductor_imprudente', NULL, 4.6300, -74.1170, 'recibido', now() - interval '2 days'),
  (3, 'hurto_o_inseguridad', 'Zona sin vigilancia en la noche', 4.7550, -74.0450, 'descartado', now() - interval '1 day');

INSERT INTO movil.activaciones_sos (usuario_id, latitud, longitud, estado, activado_en) VALUES
  (1, 4.6486, -74.0818, 'atendida', now() - interval '5 days'),
  (2, 4.6530, -74.1460, 'cancelada', now() - interval '2 days'),
  (3, 4.7550, -74.0450, 'activa', now() - interval '1 hour');
