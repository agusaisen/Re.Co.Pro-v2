-- Migración para cambiar de edad_minima/edad_maxima a año_desde/año_hasta
-- Ejecutar este script para actualizar la estructura de la base de datos

-- Agregar las nuevas columnas
ALTER TABLE disciplinas 
ADD COLUMN año_desde INT AFTER edad_maxima,
ADD COLUMN año_hasta INT AFTER año_desde;

-- Convertir los datos existentes (asumiendo año actual 2024)
-- edad_minima 16 -> año_hasta 2008 (2024 - 16)
-- edad_maxima 35 -> año_desde 1989 (2024 - 35)
UPDATE disciplinas 
SET año_desde = YEAR(CURDATE()) - edad_maxima,
    año_hasta = YEAR(CURDATE()) - edad_minima;

-- Eliminar las columnas antiguas
ALTER TABLE disciplinas 
DROP COLUMN edad_minima,
DROP COLUMN edad_maxima;

-- Verificar los cambios
SELECT id, nombre, año_desde, año_hasta, cantidad_integrantes, entrenadores, delegados, activa 
FROM disciplinas 
ORDER BY nombre;
