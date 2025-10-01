-- Crear tabla para documentación
CREATE TABLE IF NOT EXISTS documentacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(100) NOT NULL,
    tamaño_archivo INT NOT NULL,
    contenido_archivo LONGBLOB NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    subido_por INT NOT NULL,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_fecha_subida (fecha_subida),
    INDEX idx_subido_por (subido_por)
);
