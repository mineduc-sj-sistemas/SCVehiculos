-- =====================================================================
-- Migración: Agregar rol Auditor y usuario Roberto Méndez
-- Ejecutar contra: sc_vehiculos
-- =====================================================================

USE `sc_vehiculos`;

-- Eliminar rol Mecánico si existe
DELETE FROM `roles` WHERE `id` = 3;

-- Agregar rol Auditor si no existe
INSERT IGNORE INTO `roles` (`id`, `nombre`, `descripcion`)
VALUES (5, 'Auditor', 'Lectura de estadísticas, auditoría e informes de gestión');

-- Agregar usuario Auditor si no existe (password: admin123)
INSERT IGNORE INTO `usuarios` (`id`, `rol_id`, `dependencia_id`, `nombre`, `apellido`, `email`, `password_hash`, `dni`, `telefono`, `activo`)
VALUES (3, 5, NULL, 'Roberto', 'Méndez', 'auditor@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '24112334', '264-4209988', 1);

-- Si el usuario ya existía con otro rol, actualizar
UPDATE `usuarios` SET `rol_id` = 5, `activo` = 1 WHERE `email` = 'auditor@sanjuan.edu.ar';

-- Verificar resultado
SELECT u.id, u.nombre, u.apellido, u.email, r.nombre AS rol, u.activo
FROM usuarios u
JOIN roles r ON u.rol_id = r.id
ORDER BY u.id;
