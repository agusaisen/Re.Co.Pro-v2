-- Migración para actualizar la estructura de la base de datos
-- Agregar columnas de entrenadores y delegados a disciplinas
-- Modificar tabla de participantes para incluir tipos
-- Actualizar estructura de equipos

-- Agregar columnas de entrenadores y delegados a la tabla disciplinas
ALTER TABLE disciplinas 
ADD COLUMN entrenadores INT NOT NULL DEFAULT 1 AFTER cantidad_integrantes,
ADD COLUMN delegados INT NOT NULL DEFAULT 1 AFTER entrenadores;

-- Agregar columna tipo a la tabla participantes para diferenciar deportistas, entrenadores y delegados
ALTER TABLE participantes 
ADD COLUMN tipo ENUM('deportista', 'entrenador', 'delegado') NOT NULL DEFAULT 'deportista' AFTER fecha_nacimiento,
ADD COLUMN telefono VARCHAR(20) AFTER localidad_id,
ADD COLUMN email VARCHAR(255) AFTER telefono;

-- Crear índice para mejorar consultas por tipo de participante
CREATE INDEX idx_participantes_tipo ON participantes(tipo);

-- Actualizar disciplinas existentes con valores por defecto para entrenadores y delegados
UPDATE disciplinas SET 
    entrenadores = 1, 
    delegados = 1 
WHERE entrenadores IS NULL OR delegados IS NULL;

-- Verificar los cambios realizados
SELECT 'Estructura de disciplinas actualizada' as mensaje;
DESCRIBE disciplinas;

SELECT 'Estructura de participantes actualizada' as mensaje;
DESCRIBE participantes;
