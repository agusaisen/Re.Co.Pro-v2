-- Script para agregar funcionalidad de entrenadores y delegados
-- Agregar columnas de entrenadores y delegados a disciplinas
ALTER TABLE disciplinas 
ADD COLUMN entrenadores INT NOT NULL DEFAULT 1 AFTER cantidad_integrantes,
ADD COLUMN delegados INT NOT NULL DEFAULT 1 AFTER entrenadores;

-- Agregar columna tipo a participantes para diferenciar roles
ALTER TABLE participantes 
ADD COLUMN tipo ENUM('deportista', 'entrenador', 'delegado') NOT NULL DEFAULT 'deportista' AFTER fecha_nacimiento,
ADD COLUMN telefono VARCHAR(20) AFTER localidad_id,
ADD COLUMN email VARCHAR(255) AFTER telefono;

-- Crear índice para mejorar consultas por tipo
CREATE INDEX idx_participantes_tipo ON participantes(tipo);

-- Actualizar disciplinas existentes con valores específicos
UPDATE disciplinas SET 
    entrenadores = CASE 
        WHEN nombre IN ('Fútbol', 'Handball') THEN 2
        ELSE 1
    END,
    delegados = 1
WHERE entrenadores IS NULL OR delegados IS NULL;

-- Verificar cambios
SELECT 'Disciplinas actualizadas:' as mensaje;
SELECT id, nombre, cantidad_integrantes, entrenadores, delegados FROM disciplinas;
