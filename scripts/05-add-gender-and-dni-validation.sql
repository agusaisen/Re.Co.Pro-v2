-- Migración para agregar campos de género y validación de DNI por localidad
-- Ejecutar este script para actualizar la estructura de la base de datos

-- Agregar campo género a la tabla disciplinas
ALTER TABLE disciplinas 
ADD COLUMN genero ENUM('MASCULINO', 'FEMENINO', 'MIXTO') NOT NULL DEFAULT 'MIXTO' AFTER cantidad_integrantes;

-- Agregar campo género a la tabla participantes
ALTER TABLE participantes 
ADD COLUMN genero ENUM('MASCULINO', 'FEMENINO') NOT NULL DEFAULT 'MASCULINO' AFTER fecha_nacimiento;

-- Eliminar la restricción UNIQUE del DNI en participantes para permitir mismo DNI en diferentes localidades
ALTER TABLE participantes DROP INDEX dni;

-- Crear nueva restricción UNIQUE compuesta: DNI + localidad_id
-- Esto permite que el mismo DNI esté en múltiples equipos/disciplinas dentro de la misma localidad
-- pero NO permite que esté en localidades diferentes
ALTER TABLE participantes 
ADD CONSTRAINT unique_dni_localidad UNIQUE (dni, localidad_id);

-- Crear índice para mejorar consultas por género
CREATE INDEX idx_participantes_genero ON participantes(genero);
CREATE INDEX idx_disciplinas_genero ON disciplinas(genero);

-- Actualizar disciplinas existentes con géneros apropiados
UPDATE disciplinas SET genero = 'MASCULINO' WHERE nombre IN ('Fútbol');
UPDATE disciplinas SET genero = 'MIXTO' WHERE nombre IN ('Básquet', 'Vóley', 'Handball', 'Tenis', 'Natación', 'Atletismo', 'Ping Pong');

-- Actualizar participantes existentes con géneros por defecto (se puede ajustar manualmente después)
UPDATE participantes SET genero = 'MASCULINO' WHERE nombre IN ('Juan', 'Carlos', 'Luis', 'Roberto', 'Miguel', 'Diego');
UPDATE participantes SET genero = 'FEMENINO' WHERE nombre IN ('María', 'Ana', 'Elena', 'Patricia', 'Lucía');

-- Verificar los cambios realizados
SELECT 'Estructura de disciplinas actualizada con género' as mensaje;
DESCRIBE disciplinas;

SELECT 'Estructura de participantes actualizada con género y validación DNI' as mensaje;
DESCRIBE participantes;

SELECT 'Disciplinas por género:' as mensaje, genero, COUNT(*) as cantidad FROM disciplinas GROUP BY genero;
SELECT 'Participantes por género:' as mensaje, genero, COUNT(*) as cantidad FROM participantes GROUP BY genero;
