-- =====================================================================
-- Migración 001: Creación de tabla licencias_chofer
-- Sistema de Control de Movilidades (SCVehiculos)
-- Ministerio de Educación · Gobierno de San Juan
-- =====================================================================

USE `sc_vehiculos`;

CREATE TABLE IF NOT EXISTS `licencias_chofer` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `chofer_id` INT UNSIGNED NOT NULL,
  `tipo` ENUM('vacaciones', 'enfermedad', 'particular', 'capacitacion', 'franco_compensatorio', 'otra') NOT NULL DEFAULT 'otra',
  `fecha_inicio` DATE NOT NULL,
  `fecha_fin` DATE NOT NULL,
  `dias_habiles` SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  `motivo` VARCHAR(255) NULL,
  `estado` ENUM('aprobada', 'pendiente', 'rechazada', 'cancelada') NOT NULL DEFAULT 'pendiente',
  `aprobado_por_id` INT UNSIGNED NULL,
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_licencias_chofer_fecha` (`chofer_id`, `fecha_inicio`),
  KEY `idx_licencias_estado` (`estado`, `fecha_inicio`),
  CONSTRAINT `fk_licencias_chofer`
    FOREIGN KEY (`chofer_id`) REFERENCES `choferes` (`id`)
    ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_licencias_aprobador`
    FOREIGN KEY (`aprobado_por_id`) REFERENCES `usuarios` (`id`)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Datos Semilla de Licencias / Ausencias
INSERT INTO `licencias_chofer` (`chofer_id`, `tipo`, `fecha_inicio`, `fecha_fin`, `dias_habiles`, `motivo`, `estado`, `aprobado_por_id`, `observaciones`)
SELECT 1, 'franco_compensatorio', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, 'Franco compensatorio por comisión a Valle Fértil en fin de semana', 'aprobada', 1, 'Autorizado por Dirección'
WHERE NOT EXISTS (SELECT 1 FROM `licencias_chofer` WHERE `chofer_id` = 1 AND `tipo` = 'franco_compensatorio');

INSERT INTO `licencias_chofer` (`chofer_id`, `tipo`, `fecha_inicio`, `fecha_fin`, `dias_habiles`, `motivo`, `estado`, `aprobado_por_id`, `observaciones`)
SELECT 3, 'particular', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), 3, 'Trámite particular y renovación de carnet', 'aprobada', 1, 'Presentó constancia'
WHERE NOT EXISTS (SELECT 1 FROM `licencias_chofer` WHERE `chofer_id` = 3 AND `motivo` LIKE '%renovación%');

INSERT INTO `licencias_chofer` (`chofer_id`, `tipo`, `fecha_inicio`, `fecha_fin`, `dias_habiles`, `motivo`, `estado`, `aprobado_por_id`, `observaciones`)
SELECT 4, 'capacitacion', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 2, 'Curso de manejo defensivo y primeros auxilios en ruta', 'aprobada', 1, 'Organizado por Seguridad Vial San Juan'
WHERE NOT EXISTS (SELECT 1 FROM `licencias_chofer` WHERE `chofer_id` = 4 AND `tipo` = 'capacitacion');
