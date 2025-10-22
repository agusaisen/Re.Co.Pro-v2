-- Crear tabla de configuración para el sistema
CREATE TABLE IF NOT EXISTS configuracion (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar configuración inicial de fechas de inscripción
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('fecha_inicio_inscripciones', '2025-01-01', 'Fecha de inicio del período de inscripciones'),
('fecha_fin_inscripciones', '2025-12-31', 'Fecha de fin del período de inscripciones')
ON DUPLICATE KEY UPDATE valor = valor;
