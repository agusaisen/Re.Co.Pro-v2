-- Agregar columna de región a la tabla localidades
ALTER TABLE localidades 
ADD COLUMN region VARCHAR(100) DEFAULT NULL AFTER nombre;

-- Crear índice para mejorar búsquedas por región
CREATE INDEX idx_region ON localidades(region);
