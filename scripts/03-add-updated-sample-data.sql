-- Script actualizado con datos de ejemplo que incluyen la nueva estructura
-- Limpiar datos existentes para evitar conflictos
DELETE FROM equipo_participantes;
DELETE FROM equipos;
DELETE FROM participantes;
DELETE FROM disciplinas;
-- No eliminar localidades existentes, solo agregar nuevas
-- DELETE FROM localidades WHERE id > 2; -- Mantener solo las localidades de usuarios existentes

-- Insertar disciplinas con las nuevas columnas de entrenadores y delegados
INSERT INTO disciplinas (nombre, edad_minima, edad_maxima, cantidad_integrantes, entrenadores, delegados, activa) VALUES
('Fútbol', 16, 35, 11, 2, 1, TRUE),
('Básquet', 16, 40, 5, 1, 1, TRUE),
('Vóley', 16, 45, 6, 1, 1, TRUE),
('Handball', 16, 40, 7, 2, 1, TRUE),
('Tenis', 16, 50, 1, 1, 1, TRUE),
('Natación', 16, 45, 1, 1, 1, TRUE),
('Atletismo', 16, 50, 1, 1, 1, TRUE),
('Ping Pong', 16, 60, 1, 1, 1, TRUE);

-- Insertar localidades adicionales solo si no existen
INSERT IGNORE INTO localidades (nombre, activa) VALUES
('Centenario', TRUE),
('Cutral Có', TRUE),
('Plaza Huincul', TRUE),
('Zapala', TRUE),
('San Martín de los Andes', TRUE),
('Villa La Angostura', TRUE),
('Junín de los Andes', TRUE),
('Chos Malal', TRUE),
('Rincón de los Sauces', TRUE),
('Añelo', TRUE);

-- Usar solo IDs de localidades que sabemos que existen (1 y 2 de usuarios existentes)
-- Insertar participantes de ejemplo con diferentes tipos
INSERT INTO participantes (dni, nombre, apellido, fecha_nacimiento, tipo, localidad_id, telefono, email) VALUES
-- Deportistas
('12345678', 'Juan', 'Pérez', '2000-05-15', 'deportista', 1, '299-123-4567', 'juan.perez@email.com'),
('23456789', 'María', 'González', '1998-08-22', 'deportista', 1, '299-234-5678', 'maria.gonzalez@email.com'),
('34567890', 'Carlos', 'Rodríguez', '2001-03-10', 'deportista', 2, '299-345-6789', 'carlos.rodriguez@email.com'),
('45678901', 'Ana', 'Martínez', '1999-12-05', 'deportista', 2, '299-456-7890', 'ana.martinez@email.com'),
('56789012', 'Luis', 'López', '2002-07-18', 'deportista', 1, '299-567-8901', 'luis.lopez@email.com'),

-- Entrenadores (mayores de 18)
('67890123', 'Roberto', 'García', '1985-04-12', 'entrenador', 1, '299-678-9012', 'roberto.garcia@email.com'),
('78901234', 'Elena', 'Fernández', '1980-09-25', 'entrenador', 2, '299-789-0123', 'elena.fernandez@email.com'),
('89012345', 'Miguel', 'Sánchez', '1975-11-08', 'entrenador', 1, '299-890-1234', 'miguel.sanchez@email.com'),

-- Delegados (mayores de 18)
('90123456', 'Patricia', 'Torres', '1970-06-30', 'delegado', 1, '299-901-2345', 'patricia.torres@email.com'),
('01234567', 'Diego', 'Morales', '1982-02-14', 'delegado', 2, '299-012-3456', 'diego.morales@email.com'),
('11234567', 'Lucía', 'Herrera', '1978-10-03', 'delegado', 2, '299-112-3456', 'lucia.herrera@email.com');

-- Insertar equipos sin datos de responsable, solo con referencia al usuario creador
INSERT INTO equipos (disciplina_id, localidad_id, usuario_creador_id, nombre_equipo) VALUES
(1, 1, 1, 'Los Leones de Neuquén'),
(2, 2, 2, 'Águilas de Plottier'),
(3, 1, 1, 'Tigres de Neuquén');

-- Asociar participantes a equipos
INSERT INTO equipo_participantes (equipo_id, participante_id) VALUES
-- Equipo 1 (Fútbol): deportistas + entrenadores + delegado
(1, 1), (1, 2), (1, 6), (1, 9),
-- Equipo 2 (Básquet): deportistas + entrenador + delegado  
(2, 3), (2, 4), (2, 7), (2, 10),
-- Equipo 3 (Vóley): deportistas + entrenador + delegado
(3, 5), (3, 8), (3, 11);

-- Verificar que los datos se insertaron correctamente
SELECT 'Disciplinas con nueva estructura:' as mensaje, COUNT(*) as cantidad FROM disciplinas WHERE activa = TRUE;
SELECT 'Participantes por tipo:' as mensaje, tipo, COUNT(*) as cantidad FROM participantes GROUP BY tipo;
SELECT 'Equipos creados:' as mensaje, COUNT(*) as cantidad FROM equipos;
SELECT 'Relaciones equipo-participante:' as mensaje, COUNT(*) as cantidad FROM equipo_participantes;
