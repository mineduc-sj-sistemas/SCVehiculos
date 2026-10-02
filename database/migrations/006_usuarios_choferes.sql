-- =====================================================================
-- Migración 006: Creación y Vinculación de Cuentas de Usuario para Choferes
-- Sistema de Control de Vehículos - Ministerio de Educación
-- Rol 4: Chofer
-- Contraseña por defecto: admin123
-- =====================================================================

USE `sc_vehiculos`;
SET NAMES utf8mb4;

-- 1. Insertar cuentas de usuario con rol Chofer (rol_id = 4)
INSERT INTO `usuarios` (`rol_id`, `dependencia_id`, `nombre`, `apellido`, `email`, `password_hash`, `dni`, `telefono`, `activo`)
VALUES
  (4, NULL, 'Martín', 'Rojas', 'martin.rojas@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '28456123', '264-4112233', 1),
  (4, NULL, 'Lucía', 'Gómez', 'lucia.gomez@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '31789456', '264-4223344', 1),
  (4, NULL, 'Carlos', 'Molina', 'carlos.molina@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '25987654', '264-4334455', 1),
  (4, NULL, 'Esteban', 'Paredes', 'esteban.paredes@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '29345678', '264-4445566', 1),
  (4, NULL, 'Javier', 'Salinas', 'javier.salinas@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '33456789', '264-4556677', 1),
  (4, NULL, 'Ramiro', 'Talquenca', 'ramiro.talquenca@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '43280763', '2645648977', 1)
ON DUPLICATE KEY UPDATE
  `rol_id` = VALUES(`rol_id`),
  `password_hash` = VALUES(`password_hash`),
  `activo` = 1;

-- 2. Vincular usuario_id en la tabla choferes según DNI/Email
UPDATE `choferes` c
JOIN `usuarios` u ON c.dni = u.dni
SET c.usuario_id = u.id,
    c.email = u.email
WHERE c.usuario_id IS NULL;
