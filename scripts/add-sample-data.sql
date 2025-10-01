-- Script para agregar datos de ejemplo a la base de datos
-- Ejecutar después de tener las tablas creadas

-- Insertar disciplinas de ejemplo
INSERT INTO disciplinas (nombre, edad_minima, edad_maxima, cantidad_integrantes, activa) VALUES
('Fútbol', 16, 35, 11, TRUE),
('Básquet', 16, 40, 5, TRUE),
('Vóley', 16, 45, 6, TRUE),
('Handball', 16, 40, 7, TRUE),
('Tenis', 16, 50, 1, TRUE),
('Natación', 16, 45, 1, TRUE),
('Atletismo', 16, 50, 1, TRUE),
('Ping Pong', 16, 60, 1, TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar localidades de ejemplo
INSERT INTO localidades (nombre, activa) VALUES
('Neuquén Capital', TRUE),
('Plottier', TRUE),
('Centenario', TRUE),
('Cutral Có', TRUE),
('Plaza Huincul', TRUE),
('Zapala', TRUE),
('San Martín de los Andes', TRUE),
('Villa La Angostura', TRUE),
('Junín de los Andes', TRUE),
('Chos Malal', TRUE),
('Rincón de los Sauces', TRUE),
('Añelo', TRUE)
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Insertar equipos de ejemplo
INSERT INTO equipos (nombre, disciplina_id, localidad_id, responsable_nombre, responsable_apellido, responsable_email, responsable_telefono, cantidad_integrantes, estado, fecha_inscripcion) VALUES
('Los Leones', 1, 1, 'Carlos', 'González', 'carlos.gonzalez@email.com', '299-123-4567', 11, 'APROBADA', '2024-01-15 10:30:00'),
('Águilas Doradas', 2, 2, 'María', 'Rodríguez', 'maria.rodriguez@email.com', '299-234-5678', 5, 'APROBADA', '2024-01-16 14:20:00'),
('Tigres Azules', 3, 3, 'Juan', 'Pérez', 'juan.perez@email.com', '299-345-6789', 6, 'PENDIENTE', '2024-01-17 09:15:00'),
('Halcones Rojos', 4, 4, 'Ana', 'Martínez', 'ana.martinez@email.com', '299-456-7890', 7, 'APROBADA', '2024-01-18 16:45:00'),
('Rayos Verdes', 1, 5, 'Luis', 'López', 'luis.lopez@email.com', '299-567-8901', 11, 'PENDIENTE', '2024-01-19 11:30:00'),
('Estrellas Blancas', 2, 6, 'Carmen', 'Fernández', 'carmen.fernandez@email.com', '299-678-9012', 5, 'RECHAZADA', '2024-01-20 13:20:00'),
('Cóndores Negros', 5, 7, 'Roberto', 'García', 'roberto.garcia@email.com', '299-789-0123', 1, 'APROBADA', '2024-01-21 08:45:00'),
('Pumas Plateados', 6, 8, 'Elena', 'Ruiz', 'elena.ruiz@email.com', '299-890-1234', 1, 'APROBADA', '2024-01-22 15:10:00'),
('Jaguares Dorados', 7, 9, 'Miguel', 'Sánchez', 'miguel.sanchez@email.com', '299-901-2345', 1, 'PENDIENTE', '2024-01-23 12:00:00'),
('Lobos Grises', 8, 10, 'Patricia', 'Torres', 'patricia.torres@email.com', '299-012-3456', 1, 'APROBADA', '2024-01-24 17:30:00'),
('Osos Marrones', 3, 11, 'Diego', 'Morales', 'diego.morales@email.com', '299-123-4567', 6, 'PENDIENTE', '2024-01-25 10:15:00'),
('Zorros Naranjas', 4, 12, 'Lucía', 'Herrera', 'lucia.herrera@email.com', '299-234-5678', 7, 'APROBADA', '2024-01-26 14:40:00')
ON DUPLICATE KEY UPDATE nombre = VALUES(nombre);

-- Verificar que los datos se insertaron correctamente
SELECT 'Disciplinas insertadas:' as mensaje, COUNT(*) as cantidad FROM disciplinas WHERE activa = TRUE
UNION ALL
SELECT 'Localidades insertadas:' as mensaje, COUNT(*) as cantidad FROM localidades WHERE activa = TRUE
UNION ALL
SELECT 'Equipos insertados:' as mensaje, COUNT(*) as cantidad FROM equipos;
