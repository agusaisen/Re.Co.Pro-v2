-- Script para crear la base de datos y tablas para los Juegos Regionales Neuquinos
-- Base de datos: u904484423_dep_jr

-- Tabla de disciplinas deportivas
CREATE TABLE IF NOT EXISTS disciplinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    edad_minima INT NOT NULL,
    edad_maxima INT NOT NULL,
    cantidad_integrantes INT NOT NULL,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de localidades
CREATE TABLE IF NOT EXISTS localidades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    dni VARCHAR(20) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    localidad_id INT NOT NULL,
    rol ENUM('administrador', 'gestor') NOT NULL DEFAULT 'gestor',
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (localidad_id) REFERENCES localidades(id)
);

-- Tabla de participantes (deportistas)
CREATE TABLE IF NOT EXISTS participantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dni VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    localidad_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (localidad_id) REFERENCES localidades(id)
);

-- Tabla de equipos
CREATE TABLE IF NOT EXISTS equipos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    disciplina_id INT NOT NULL,
    localidad_id INT NOT NULL,
    usuario_creador_id INT NOT NULL,
    nombre_equipo VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
    FOREIGN KEY (localidad_id) REFERENCES localidades(id),
    FOREIGN KEY (usuario_creador_id) REFERENCES usuarios(id),
    UNIQUE KEY unique_disciplina_localidad_usuario (disciplina_id, localidad_id, usuario_creador_id)
);

-- Tabla de integrantes de equipos
CREATE TABLE IF NOT EXISTS equipo_participantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipo_id INT NOT NULL,
    participante_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (equipo_id) REFERENCES equipos(id) ON DELETE CASCADE,
    FOREIGN KEY (participante_id) REFERENCES participantes(id),
    UNIQUE KEY unique_equipo_participante (equipo_id, participante_id)
);

-- Índices para mejorar performance
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_dni ON usuarios(dni);
CREATE INDEX idx_participantes_dni ON participantes(dni);
CREATE INDEX idx_equipos_localidad ON equipos(localidad_id);
CREATE INDEX idx_equipos_disciplina ON equipos(disciplina_id);
