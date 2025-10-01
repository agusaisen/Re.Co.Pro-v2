-- Actualizar la contraseña del administrador con el hash correcto
-- Password: admin123
UPDATE usuarios 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE email = 'admin@neuquen.gov.ar';

-- Crear un gestor de ejemplo para pruebas
-- Password: gestor123
INSERT INTO usuarios (nombre, apellido, dni, email, password_hash, localidad_id, rol) VALUES
('Gestor', 'Ejemplo', '12345678', 'gestor@plottier.gov.ar', '$2b$10$N9qo8uLOickgx2ZMRZoMye.fgsuzanjHH/NYh50wjjIxN.2e7u2dS', 2, 'gestor')
ON DUPLICATE KEY UPDATE password_hash = '$2b$10$N9qo8uLOickgx2ZMRZoMye.fgsuzanjHH/NYh50wjjIxN.2e7u2dS';
