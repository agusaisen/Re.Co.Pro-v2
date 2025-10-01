-- Datos iniciales para los Juegos Regionales Neuquinos

-- Insertar disciplinas deportivas
INSERT INTO disciplinas (nombre, edad_minima, edad_maxima, cantidad_integrantes) VALUES
('Voley', 12, 18, 6),
('Básquet', 12, 18, 5),
('Fútbol', 12, 18, 11),
('Futsal', 12, 18, 5),
('Tenis de mesa', 12, 18, 1);

-- Insertar algunas localidades de Neuquén
INSERT INTO localidades (nombre) VALUES
('Neuquén Capital'),
('Plottier'),
('Cipolletti'),
('Cutral Có'),
('Plaza Huincul'),
('Zapala'),
('San Martín de los Andes'),
('Villa La Angostura'),
('Junín de los Andes'),
('Chos Malal'),
('Rincón de los Sauces'),
('Centenario'),
('Vista Alegre'),
('Senillosa'),
('Picún Leufú');

-- Crear usuario administrador por defecto
-- Password: admin123 (hash bcrypt)
INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, localidad_id, rol) VALUES
('Administrador', 'Sistema', '00000000', 'admin@neuquen.gov.ar', '$2b$10$rOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQqQqQqQqQqOzJqQqQqQqQq', 1, 'administrador');
