-- Script para crear tabla de enlaces de documentos a participantes
-- Permite vincular documentos específicamente a deportistas

CREATE TABLE IF NOT EXISTS documento_participante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    documento_id INT NOT NULL,
    participante_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (documento_id) REFERENCES documentacion(id) ON DELETE CASCADE,
    FOREIGN KEY (participante_id) REFERENCES participantes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_documento_participante (documento_id, participante_id),
    INDEX idx_participante_documentos (participante_id),
    INDEX idx_documento_participantes (documento_id)
);

-- Comentario: Esta tabla permite vincular documentos específicamente a participantes (deportistas)
-- Solo se usará para deportistas, no para entrenadores ni delegados según los requerimientos
