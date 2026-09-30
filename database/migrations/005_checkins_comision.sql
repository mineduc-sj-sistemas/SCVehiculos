-- Migración 005: Tabla de check-ins de paradas geolocalizadas para el Portal del Chofer
-- Base de datos: sc_vehiculos

USE `sc_vehiculos`;

CREATE TABLE IF NOT EXISTS `checkins_comision` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `comision_id` INT UNSIGNED NOT NULL,
  `chofer_id` INT UNSIGNED NOT NULL,
  `parada_index` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `destino_nombre` VARCHAR(255) NOT NULL,
  `latitud` DECIMAL(10, 8) NULL,
  `longitud` DECIMAL(11, 8) NULL,
  `precision_gps` DECIMAL(6, 2) NULL,
  `observaciones` VARCHAR(255) NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_checkins_comision` (`comision_id`),
  KEY `idx_checkins_chofer_fecha` (`chofer_id`, `fecha_hora`),
  CONSTRAINT `fk_checkins_comision` FOREIGN KEY (`comision_id`) REFERENCES `comisiones` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_checkins_chofer` FOREIGN KEY (`chofer_id`) REFERENCES `choferes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
