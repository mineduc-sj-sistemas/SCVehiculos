-- =====================================================================
-- BASE DE DATOS COMPLETA: sc_vehiculos (Schema DDL + Seed Data Oficial)
-- Ministerio de Educación · Gobierno de San Juan
-- Generado automáticamente con codificación UTF-8 / utf8mb4
-- =====================================================================

CREATE DATABASE IF NOT EXISTS sc_vehiculos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE sc_vehiculos;
SET NAMES utf8mb4;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- Base de Datos: sc_vehiculos
-- Sistema de Control de Movilidades y Vehículos
-- Ministerio de Educación · Gobierno de San Juan
-- Motor: MySQL 8.0+ / MariaDB 10.5+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `sc_vehiculos`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `sc_vehiculos`;

-- Deshabilitar chequeo de foreign keys temporalmente para creación limpia
SET FOREIGN_KEY_CHECKS = 0;

-- ---------------------------------------------------------------------
-- 1. Tabla: roles
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Tabla: dependencias (Áreas, Direcciones y Supervisiones)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `dependencias`;
CREATE TABLE `dependencias` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(150) NOT NULL,
  `sigla` VARCHAR(30) NULL,
  `responsable` VARCHAR(100) NULL,
  `telefono` VARCHAR(50) NULL,
  `email` VARCHAR(100) NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_dependencias_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Tabla: usuarios
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `usuarios`;
CREATE TABLE `usuarios` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rol_id` INT UNSIGNED NOT NULL,
  `dependencia_id` INT UNSIGNED NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `dni` VARCHAR(20) NULL,
  `telefono` VARCHAR(50) NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `ultimo_acceso` DATETIME NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuarios_email` (`email`),
  UNIQUE KEY `uq_usuarios_dni` (`dni`),
  KEY `idx_usuarios_rol` (`rol_id`),
  KEY `idx_usuarios_dependencia` (`dependencia_id`),
  CONSTRAINT `fk_usuarios_rol` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_usuarios_dependencia` FOREIGN KEY (`dependencia_id`) REFERENCES `dependencias` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. Tabla: choferes
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `choferes`;
CREATE TABLE `choferes` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `usuario_id` INT UNSIGNED NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) NOT NULL,
  `dni` VARCHAR(20) NOT NULL,
  `cuil` VARCHAR(20) NULL,
  `telefono` VARCHAR(50) NULL,
  `email` VARCHAR(150) NULL,
  `direccion` VARCHAR(255) NULL,
  `foto_dni_frente` LONGTEXT NULL,
  `foto_dni_dorso` LONGTEXT NULL,
  `numero_licencia` VARCHAR(50) NOT NULL,
  `categoria_licencia` VARCHAR(100) NOT NULL,
  `fecha_vencimiento_licencia` DATE NOT NULL,
  `foto_licencia_frente` LONGTEXT NULL,
  `foto_licencia_dorso` LONGTEXT NULL,
  `estado` ENUM('disponible', 'en_comision', 'licencia', 'inactivo') NOT NULL DEFAULT 'disponible',
  `observaciones` TEXT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_choferes_dni` (`dni`),
  UNIQUE KEY `uq_choferes_cuil` (`cuil`),
  UNIQUE KEY `uq_choferes_usuario` (`usuario_id`),
  KEY `idx_choferes_estado_venc` (`estado`, `fecha_vencimiento_licencia`),
  KEY `idx_choferes_vencimiento` (`fecha_vencimiento_licencia`),
  CONSTRAINT `fk_choferes_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. Tabla: tipos_vehiculo
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `tipos_vehiculo`;
CREATE TABLE `tipos_vehiculo` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(50) NOT NULL,
  `descripcion` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_tipos_vehiculo_nombre` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. Tabla: vehiculos (Parque Automotor / Flota)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `vehiculos`;
CREATE TABLE `vehiculos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `patente` VARCHAR(15) NOT NULL,
  `tipo_vehiculo_id` INT UNSIGNED NOT NULL,
  `dependencia_id` INT UNSIGNED NULL,
  `titular_nombre` VARCHAR(150) NULL,
  `titular_cuit_cuil` VARCHAR(20) NULL,
  `registro_seccional` VARCHAR(100) NULL,
  `marca` VARCHAR(50) NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `version` VARCHAR(100) NULL,
  `anio` SMALLINT UNSIGNED NULL,
  `color` VARCHAR(50) NULL,
  `numero_chasis` VARCHAR(50) NULL,
  `numero_motor` VARCHAR(50) NULL,
  `numero_cedula` VARCHAR(50) NULL,
  `fecha_vencimiento_cedula` DATE NULL,
  `tipo_combustible` ENUM('nafta_super', 'nafta_premium', 'diesel_500', 'diesel_grado_3', 'gnc', 'hibrido', 'electrico') NOT NULL DEFAULT 'diesel_500',
  `capacidad_tanque_litros` DECIMAL(6,2) NULL,
  `capacidad_pasajeros` TINYINT UNSIGNED NULL DEFAULT 5,
  `odometro_actual` INT UNSIGNED NOT NULL DEFAULT 0,
  `numero_rto` VARCHAR(50) NULL,
  `tiene_08` TINYINT(1) NOT NULL DEFAULT 0,
  `estado_08` ENUM('no_aplica', 'pendiente_firma', 'firmado', 'en_tramite', 'inscripto') NOT NULL DEFAULT 'no_aplica',
  `fecha_vencimiento_08` DATE NULL,
  `numero_control_08` VARCHAR(50) NULL,
  `fecha_vencimiento_vtv` DATE NOT NULL,
  `compania_seguro` VARCHAR(100) NULL,
  `numero_poliza` VARCHAR(100) NULL,
  `fecha_vencimiento_seguro` DATE NULL,
  `estado` ENUM('disponible', 'en_comision', 'en_taller', 'baja') NOT NULL DEFAULT 'disponible',
  `observaciones` TEXT NULL,
  `foto_url` TEXT NULL,
  `activo` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_vehiculos_patente` (`patente`),
  UNIQUE KEY `uq_vehiculos_chasis` (`numero_chasis`),
  UNIQUE KEY `uq_vehiculos_motor` (`numero_motor`),
  KEY `idx_vehiculos_tipo` (`tipo_vehiculo_id`),
  KEY `idx_vehiculos_dependencia` (`dependencia_id`),
  KEY `idx_vehiculos_estado_vtv` (`estado`, `fecha_vencimiento_vtv`),
  KEY `idx_vehiculos_odometro` (`odometro_actual`),
  CONSTRAINT `fk_vehiculos_tipo` FOREIGN KEY (`tipo_vehiculo_id`) REFERENCES `tipos_vehiculo` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_vehiculos_dependencia` FOREIGN KEY (`dependencia_id`) REFERENCES `dependencias` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. Tabla: comisiones (Hojas de Ruta y Solicitud de Movilidades)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `comisiones`;
CREATE TABLE `comisiones` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo_comision` VARCHAR(30) NOT NULL,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `chofer_id` INT UNSIGNED NOT NULL,
  `dependencia_solicitante_id` INT UNSIGNED NOT NULL,
  `solicitante_nombre` VARCHAR(150) NULL,
  `origen` VARCHAR(150) NOT NULL DEFAULT 'Ministerio de Educación - Centro Cívico',
  `destino` VARCHAR(500) NOT NULL,
  `motivo` TEXT NOT NULL,
  `cantidad_pasajeros` TINYINT UNSIGNED NOT NULL DEFAULT 1,
  `fecha_salida_programada` DATETIME NOT NULL,
  `fecha_salida_real` DATETIME NULL,
  `fecha_regreso_estimada` DATETIME NOT NULL,
  `fecha_regreso_real` DATETIME NULL,
  `odometro_salida` INT UNSIGNED NULL,
  `odometro_regreso` INT UNSIGNED NULL,
  `estado` ENUM('programada', 'en_curso', 'finalizada', 'cancelada') NOT NULL DEFAULT 'programada',
  `observaciones` TEXT NULL,
  `usuario_creador_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_comisiones_codigo` (`codigo_comision`),
  KEY `idx_comisiones_vehiculo_fecha` (`vehiculo_id`, `fecha_salida_real`),
  KEY `idx_comisiones_chofer_fecha` (`chofer_id`, `fecha_salida_real`),
  KEY `idx_comisiones_estado_programada` (`estado`, `fecha_salida_programada`),
  KEY `idx_comisiones_dependencia` (`dependencia_solicitante_id`),
  CONSTRAINT `fk_comisiones_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_comisiones_chofer` FOREIGN KEY (`chofer_id`) REFERENCES `choferes` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_comisiones_dependencia` FOREIGN KEY (`dependencia_solicitante_id`) REFERENCES `dependencias` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_comisiones_usuario_creador` FOREIGN KEY (`usuario_creador_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. Tabla: mantenimientos (Taller y Servicios)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `mantenimientos`;
CREATE TABLE `mantenimientos` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `tipo` ENUM('preventivo', 'correctivo', 'inspeccion') NOT NULL DEFAULT 'preventivo',
  `titulo` VARCHAR(150) NOT NULL,
  `descripcion` TEXT NULL,
  `taller_proveedor` VARCHAR(150) NULL,
  `odometro_servicio` INT UNSIGNED NOT NULL,
  `fecha_programada` DATE NOT NULL,
  `fecha_ingreso` DATETIME NULL,
  `fecha_egreso` DATETIME NULL,
  `costo_mano_obra` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `costo_repuestos` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `costo_total` DECIMAL(12,2) GENERATED ALWAYS AS (`costo_mano_obra` + `costo_repuestos`) STORED,
  `numero_factura` VARCHAR(50) NULL,
  `estado` ENUM('programado', 'en_curso', 'completado', 'cancelado') NOT NULL DEFAULT 'programado',
  `detalle_trabajos` TEXT NULL,
  `proximo_mantenimiento_km` INT UNSIGNED NULL,
  `proximo_mantenimiento_fecha` DATE NULL,
  `usuario_registro_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_mantenimientos_vehiculo_estado` (`vehiculo_id`, `estado`, `fecha_programada`),
  KEY `idx_mantenimientos_taller` (`taller_proveedor`),
  CONSTRAINT `fk_mantenimientos_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_mantenimientos_usuario` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. Tabla: cargas_combustible
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `cargas_combustible`;
CREATE TABLE `cargas_combustible` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `chofer_id` INT UNSIGNED NULL,
  `comision_id` INT UNSIGNED NULL,
  `fecha_carga` DATETIME NOT NULL,
  `estacion_servicio` VARCHAR(150) NULL,
  `tipo_combustible` ENUM('nafta_super', 'nafta_premium', 'diesel_500', 'diesel_grado_3', 'gnc') NOT NULL,
  `litros` DECIMAL(8,2) NOT NULL,
  `precio_por_litro` DECIMAL(10,2) NOT NULL,
  `importe_total` DECIMAL(12,2) NOT NULL,
  `odometro_carga` INT UNSIGNED NOT NULL,
  `tanque_lleno` TINYINT(1) NOT NULL DEFAULT 1,
  `numero_ticket` VARCHAR(50) NULL,
  `metodo_pago` ENUM('tarjeta_flota', 'orden_oficial', 'efectivo_fondo_fijo') NOT NULL DEFAULT 'tarjeta_flota',
  `rendimiento_km_l` DECIMAL(6,2) NULL,
  `observaciones` VARCHAR(255) NULL,
  `usuario_registro_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_combustible_vehiculo_fecha` (`vehiculo_id`, `fecha_carga`),
  KEY `idx_combustible_chofer` (`chofer_id`),
  KEY `idx_combustible_comision` (`comision_id`),
  CONSTRAINT `fk_combustible_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT `fk_combustible_chofer` FOREIGN KEY (`chofer_id`) REFERENCES `choferes` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_combustible_comision` FOREIGN KEY (`comision_id`) REFERENCES `comisiones` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_combustible_usuario` FOREIGN KEY (`usuario_registro_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. Tabla: auditoria_estados_vehiculo (Trazabilidad y Log de Estados)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `auditoria_estados_vehiculo`;
CREATE TABLE `auditoria_estados_vehiculo` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `vehiculo_id` INT UNSIGNED NOT NULL,
  `estado_anterior` ENUM('disponible', 'en_comision', 'en_taller', 'baja') NOT NULL,
  `estado_nuevo` ENUM('disponible', 'en_comision', 'en_taller', 'baja') NOT NULL,
  `motivo` VARCHAR(255) NULL,
  `comision_id` INT UNSIGNED NULL,
  `mantenimiento_id` INT UNSIGNED NULL,
  `usuario_id` INT UNSIGNED NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_vehiculo_fecha` (`vehiculo_id`, `created_at`),
  CONSTRAINT `fk_auditoria_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculos` (`id`) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT `fk_auditoria_comision` FOREIGN KEY (`comision_id`) REFERENCES `comisiones` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_auditoria_mantenimiento` FOREIGN KEY (`mantenimiento_id`) REFERENCES `mantenimientos` (`id`) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. Tabla: licencias_chofer (Licencias Laborales y Ausencias de Choferes)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `licencias_chofer`;
CREATE TABLE `licencias_chofer` (
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

-- ---------------------------------------------------------------------
-- 12. Tabla: checkins_comision (Paradas geolocalizadas en Portal Chofer)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS `checkins_comision`;
CREATE TABLE `checkins_comision` (
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

-- Reactivar chequeo de foreign keys
SET FOREIGN_KEY_CHECKS = 1;



-- =====================================================================
-- INSERCIÓN DE DATOS SEMILLA / MAESTROS OFICIALES
-- =====================================================================

-- =====================================================================
-- Datos Semilla (Seed Dinámico): sc_vehiculos
-- Coherente con los datos de la interfaz de SCVehiculos
-- Utiliza fechas relativas para mantenerse siempre vigente
-- =====================================================================

USE `sc_vehiculos`;

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `checkins_comision`;
TRUNCATE TABLE `auditoria_estados_vehiculo`;
TRUNCATE TABLE `cargas_combustible`;
TRUNCATE TABLE `mantenimientos`;
TRUNCATE TABLE `comisiones`;
TRUNCATE TABLE `vehiculos`;
TRUNCATE TABLE `tipos_vehiculo`;
TRUNCATE TABLE `licencias_chofer`;
TRUNCATE TABLE `choferes`;
TRUNCATE TABLE `usuarios`;
TRUNCATE TABLE `dependencias`;
TRUNCATE TABLE `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Roles
INSERT INTO `roles` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Administrador', 'Acceso total al sistema y gestión de flota'),
(2, 'Operador / Despachante', 'Gestión de comisiones, cargas y hojas de ruta'),
(4, 'Chofer', 'Consulta de hojas de ruta asignadas'),
(5, 'Auditor', 'Lectura de estadísticas, auditoría e informes de gestión');

-- 2. Dependencias del Ministerio de Educación
INSERT INTO `dependencias` (`id`, `nombre`, `sigla`, `responsable`, `telefono`, `email`) VALUES
(1, 'Dirección de Educación Rural', 'DER', 'Lic. Patricia Albarracín', '264-4305010', 'educacion.rural@sanjuan.edu.ar'),
(2, 'Supervisión Zona Norte', 'SZN', 'Prof. Roberto Castro', '264-4305022', 'supervision.norte@sanjuan.edu.ar'),
(3, 'Dirección de Infraestructura Escolar', 'DIE', 'Arq. Marcelo Quiroga', '264-4305045', 'infraestructura.escolar@sanjuan.edu.ar'),
(4, 'Dirección de Educación Primaria', 'DEP', 'Prof. Silvia Fernández', '264-4305030', 'educacion.primaria@sanjuan.edu.ar'),
(5, 'Dirección de Educación Secundaria', 'DES', 'Prof. Alejandro Morales', '264-4305035', 'educacion.secundaria@sanjuan.edu.ar');

-- 3. Usuarios iniciales (Password demo: admin123)
INSERT INTO `usuarios` (`id`, `rol_id`, `dependencia_id`, `nombre`, `apellido`, `email`, `password_hash`, `dni`, `telefono`, `activo`) VALUES
(1, 1, NULL, 'María', 'Gutiérrez', 'maria.gutierrez@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '27456789', '264-5012345', 1),
(2, 2, NULL, 'Gonzalo', 'Pérez', 'gonzalo.perez@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '32145678', '264-5023456', 1),
(3, 5, NULL, 'Roberto', 'Méndez', 'auditor@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '24112334', '264-4209988', 1),
(4, 4, NULL, 'Martín', 'Rojas', 'martin.rojas@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '28456123', '264-4112233', 1),
(5, 4, NULL, 'Lucía', 'Gómez', 'lucia.gomez@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '31789456', '264-4223344', 1),
(6, 4, NULL, 'Carlos', 'Molina', 'carlos.molina@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '25987654', '264-4334455', 1),
(7, 4, NULL, 'Esteban', 'Paredes', 'esteban.paredes@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '29345678', '264-4445566', 1),
(8, 4, NULL, 'Javier', 'Salinas', 'javier.salinas@sanjuan.edu.ar', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '33456789', '264-4556677', 1);

-- 4. Choferes con vencimientos relativos
INSERT INTO `choferes` (`id`, `usuario_id`, `nombre`, `apellido`, `dni`, `cuil`, `telefono`, `email`, `direccion`, `numero_licencia`, `categoria_licencia`, `fecha_vencimiento_licencia`, `estado`, `observaciones`) VALUES
(1, 4, 'Martín', 'Rojas', '28456123', '20-28456123-7', '264-4112233', 'martin.rojas@sanjuan.edu.ar', 'Capital, San Juan', 'SJ-28456123', 'B2', DATE_ADD(CURDATE(), INTERVAL 320 DAY), 'en_comision', 'Chofer asignado a viajes interdepartamentales'),
(2, 5, 'Lucía', 'Gómez', '31789456', '27-31789456-4', '264-4223344', 'lucia.gomez@sanjuan.edu.ar', 'Rivadavia, San Juan', 'SJ-31789456', 'D1', DATE_ADD(CURDATE(), INTERVAL 240 DAY), 'en_comision', 'Licencia profesional para transporte de pasajeros'),
(3, 6, 'Carlos', 'Molina', '25987654', '20-25987654-2', '264-4334455', 'carlos.molina@sanjuan.edu.ar', 'Santa Lucía, San Juan', 'SJ-25987654', 'B1', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'disponible', 'Carnet próximo a vencer (aviso automático emitido)'),
(4, 7, 'Esteban', 'Paredes', '29345678', '20-29345678-9', '264-4445566', 'esteban.paredes@sanjuan.edu.ar', 'Rawson, San Juan', 'SJ-29345678', 'B2', DATE_ADD(CURDATE(), INTERVAL 450 DAY), 'disponible', NULL),
(5, 8, 'Javier', 'Salinas', '33456789', '20-33456789-1', '264-4556677', 'javier.salinas@sanjuan.edu.ar', 'Chimbas, San Juan', 'SJ-33456789', 'B1', DATE_ADD(CURDATE(), INTERVAL 22 DAY), 'disponible', 'Turno renovación asignado');

-- 5. Tipos de Vehículo
INSERT INTO `tipos_vehiculo` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Camioneta', 'Pick-up 4x2 o 4x4 para caminos de montaña y rurales'),
(2, 'Utilitario', 'Furgón pequeño para carga ligera y logística escolar'),
(3, 'Sedán', 'Vehículo de pasajeros para traslados urbanos y protocolares'),
(4, 'Minibús', 'Transporte de contingentes y delegaciones educativas'),
(5, 'Camión', 'Camión de carga pesada para distribución de mobiliario escolar'),
(6, 'SUV', 'Vehículo utilitario deportivo para supervisión pedagógica');

-- 6. Flota Oficial Inicial (con Formulario 08, Titularidad, Color y Foto)
INSERT INTO `vehiculos` (
  `id`, `patente`, `tipo_vehiculo_id`, `dependencia_id`, `titular_nombre`, `titular_cuit_cuil`,
  `registro_seccional`, `marca`, `modelo`, `version`, `anio`, `color`,
  `numero_chasis`, `numero_motor`, `numero_cedula`, `fecha_vencimiento_cedula`, `numero_rto`,
  `tiene_08`, `estado_08`, `fecha_vencimiento_08`, `numero_control_08`,
  `tipo_combustible`, `capacidad_tanque_litros`, `capacidad_pasajeros`, `odometro_actual`,
  `fecha_vencimiento_vtv`, `compania_seguro`, `numero_poliza`, `fecha_vencimiento_seguro`,
  `estado`, `observaciones`, `foto_url`
) VALUES
(1, 'AF 789 CD', 3, 1, 'Ministerio de Educación · Gob. de San Juan', '30-99901234-7', 'San Juan N° 1', 'Peugeot', '301', 'Allure 1.6 HDi', 2023, 'Blanco Banquise', '8AJ301HDK2023901', 'DV6D998124', 'CV-882190-SJ', '2027-04-15', 'RTO-SJ-2024-1102', 1, 'inscripto', NULL, NULL, 'diesel_grado_3', 50, 5, 18250, '2026-11-20', 'Nación Seguros', 'POL-982103-SJ', '2026-10-31', 'disponible', 'Unidad asignada a comisiones protocolares e inspecciones escolares urbanas.', '/vehiculos/auto.png'),
(2, 'AE 456 EF', 2, 2, 'Ministerio de Educación · Gob. de San Juan', '30-99901234-7', 'San Juan N° 2', 'Fiat', 'Qubo', 'Dynamic 1.4 8v', 2023, 'Gris Plata', '8APQUBO14K881234', '178B8011234', 'CV-991204-SJ', '2027-02-10', 'RTO-SJ-2024-3319', 1, 'firmado', '2026-12-15', '08-SJ-88901-B', 'nafta_super', 45, 5, 29400, '2026-12-10', 'Nación Seguros', 'POL-441029-SJ', '2026-11-15', 'disponible', 'Afectada a supervisores pedagógicos en departamentos alejados (Jáchal e Iglesia).', '/vehiculos/suv.png'),
(3, 'AF 123 CD', 1, 4, 'Ministerio de Educación · Gob. de San Juan', '30-99901234-7', 'San Juan N° 3', 'Toyota', 'Hilux 4x4', 'SRX 2.8 TDI Automática', 2024, 'Blanco Perlado', '8AJBA3CD4E5678901', '1GD9876543', 'CV-098234-SJ', '2027-05-15', 'RTO-SJ-2024-8841', 1, 'firmado', '2026-11-30', '08-SJ-99882-B', 'diesel_grado_3', 80, 5, 14500, '2027-01-31', 'Nación Seguros', 'POL-784512-SJ', '2026-12-31', 'disponible', 'Equipada con tracción 4x4 y protector de cárter para caminos cordilleranos y escuelas de difícil acceso.', '/vehiculos/camioneta.png'),
(4, 'AD 902 KL', 4, 5, 'Ministerio de Educación · Gob. de San Juan', '30-99901234-7', 'San Juan N° 1', 'Fiat', 'Ducato Maxicargo', '2.3 Multijet Pasajeros', 2022, 'Blanco Banquise', '8APDDUC23M990142', 'F1AE0481N8812', 'CV-447192-SJ', '2026-09-30', 'RTO-SJ-2024-5501', 1, 'inscripto', NULL, NULL, 'diesel_grado_3', 90, 15, 58300, '2026-10-15', 'Nación Seguros', 'POL-119283-SJ', '2026-10-15', 'disponible', 'Combi institucional para traslado de profesionales de gabinetes y delegaciones escolares.', '/vehiculos/combi.png'),
(5, 'AC 345 GH', 5, 3, 'Ministerio de Educación · Gob. de San Juan', '30-99901234-7', 'San Juan N° 2', 'Scania', 'P310 Cargas', '4x2 Caja Paquetera Térmica', 2021, 'Blanco Puro', '9BS310P4X2N11094', 'DC09115L01', 'CV-338291-SJ', '2026-11-15', 'RTO-SJ-2024-9041', 1, 'inscripto', NULL, NULL, 'diesel_500', 300, 3, 94200, '2026-11-30', 'Nación Seguros', 'POL-667190-SJ', '2026-11-30', 'disponible', 'Camión de carga pesada para distribución de mobiliario escolar, bancos, pupitres y módulos alimentarios.', '/vehiculos/camion.png');

-- 7. Comisiones en tiempo real
INSERT INTO `comisiones` (`id`, `codigo_comision`, `vehiculo_id`, `chofer_id`, `dependencia_solicitante_id`, `solicitante_nombre`, `origen`, `destino`, `motivo`, `cantidad_pasajeros`, `fecha_salida_programada`, `fecha_salida_real`, `fecha_regreso_estimada`, `fecha_regreso_real`, `odometro_salida`, `odometro_regreso`, `estado`, `observaciones`, `usuario_creador_id`) VALUES
(1, 'COM-2024-0089', 1, 1, 1, 'Patricia Albarracín', 'Ministerio de Educación - Centro Cívico', 'Valle Fértil', 'Relevamiento de escuelas albergue y entrega de material pedagógico', 4, DATE_SUB(NOW(), INTERVAL 3 HOUR), DATE_SUB(NOW(), INTERVAL 2 HOUR), DATE_ADD(NOW(), INTERVAL 28 HOUR), NULL, 44980, NULL, 'en_curso', 'Salió en horario. Se prevé pernocte en San Agustín.', 1),
(2, 'COM-2024-0090', 5, 2, 2, 'Roberto Castro', 'Ministerio de Educación - Centro Cívico', 'Jáchal', 'Reunión de supervisores escolares y directivos departamento Jáchal', 12, DATE_SUB(NOW(), INTERVAL 6 HOUR), DATE_SUB(NOW(), INTERVAL 5 HOUR), DATE_ADD(NOW(), INTERVAL 14 HOUR), NULL, 104250, NULL, 'en_curso', 'En viaje por Ruta 40 Norte.', 1),
(3, 'COM-2024-0091', 2, 3, 3, 'Marcelo Quiroga', 'Ministerio de Educación - Centro Cívico', 'Calingasta', 'Inspección técnica de obras de ampliación en Escuela Técnica de Barreal', 2, TIMESTAMP(CURDATE(), '14:30:00'), NULL, TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00'), NULL, NULL, NULL, 'programada', 'Lleva herramientas de medición e instrumental técnico.', 1);

-- 8. Mantenimientos
INSERT INTO `mantenimientos` (`id`, `vehiculo_id`, `tipo`, `titulo`, `descripcion`, `taller_proveedor`, `odometro_servicio`, `fecha_programada`, `fecha_ingreso`, `fecha_egreso`, `costo_mano_obra`, `costo_repuestos`, `numero_factura`, `estado`, `detalle_trabajos`, `proximo_mantenimiento_km`, `proximo_mantenimiento_fecha`, `usuario_registro_id`) VALUES
(1, 3, 'preventivo', 'Cambio de aceite y filtros', 'Servicio programado de los 60.000 km: aceite sintético 5W30, filtro de aceite, aire y combustible.', 'Taller Mecánico Central San Juan', 61930, CURDATE(), TIMESTAMP(CURDATE(), '09:30:00'), NULL, 45000.00, 185000.00, 'F-A-0004-0001258', 'en_curso', 'Ingresó unidad. Trabajo en ejecución.', 72000, DATE_ADD(CURDATE(), INTERVAL 180 DAY), 1),
(2, 4, 'preventivo', 'Revisión de frenos', 'Control de pastillas de freno delanteras, discos y purgado de líquido de frenos.', 'Frenos & Embragues del Oeste', 32110, DATE_ADD(CURDATE(), INTERVAL 1 DAY), NULL, NULL, 30000.00, 75000.00, NULL, 'programado', 'Turno confirmado para primera hora.', 45000, DATE_ADD(CURDATE(), INTERVAL 270 DAY), 1);

-- 9. Cargas de combustible
INSERT INTO `cargas_combustible` (`id`, `vehiculo_id`, `chofer_id`, `comision_id`, `fecha_carga`, `estacion_servicio`, `tipo_combustible`, `litros`, `precio_por_litro`, `importe_total`, `odometro_carga`, `tanque_lleno`, `numero_ticket`, `metodo_pago`, `rendimiento_km_l`, `observaciones`, `usuario_registro_id`) VALUES
(1, 1, 1, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR), 'YPF Centro Cívico', 'diesel_grado_3', 68.50, 1250.00, 85625.00, 44980, 1, 'TK-0089-14521', 'tarjeta_flota', 11.90, 'Carga previa a salida hacia Valle Fértil', 1),
(2, 5, 2, 2, DATE_SUB(NOW(), INTERVAL 5 HOUR), 'YPF Lateral Circunvalación', 'diesel_grado_3', 70.00, 1250.00, 87500.00, 104250, 1, 'TK-0012-78945', 'tarjeta_flota', 7.50, 'Tanque lleno para recorrido ida y vuelta a Jáchal', 1),
(3, 4, 4, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 'Shell Av. Libertador', 'nafta_super', 38.20, 1100.00, 42020.00, 31850, 1, 'TK-0034-55612', 'tarjeta_flota', 13.50, 'Carga para comisiones en Gran San Juan', 1);

-- 10. Auditoría de Estados
INSERT INTO `auditoria_estados_vehiculo` (`id`, `vehiculo_id`, `estado_anterior`, `estado_nuevo`, `motivo`, `comision_id`, `mantenimiento_id`, `usuario_id`, `created_at`) VALUES
(1, 1, 'disponible', 'en_comision', 'Inicio de comisión a Valle Fértil COM-2024-0089', 1, NULL, 1, DATE_SUB(NOW(), INTERVAL 2 HOUR)),
(2, 5, 'disponible', 'en_comision', 'Inicio de comisión a Jáchal COM-2024-0090', 2, NULL, 1, DATE_SUB(NOW(), INTERVAL 5 HOUR)),
(3, 3, 'disponible', 'en_taller', 'Ingreso a servicio mecánico de 60.000 km', NULL, 1, 1, TIMESTAMP(CURDATE(), '09:30:00'));

-- 11. Licencias y Ausencias de Choferes
INSERT INTO `licencias_chofer` (`id`, `chofer_id`, `tipo`, `fecha_inicio`, `fecha_fin`, `dias_habiles`, `motivo`, `estado`, `aprobado_por_id`, `observaciones`) VALUES
(1, 1, 'franco_compensatorio', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 DAY), 2, 'Franco compensatorio por comisión a Valle Fértil en fin de semana', 'aprobada', 1, 'Autorizado por Dirección'),
(2, 3, 'particular', DATE_SUB(CURDATE(), INTERVAL 20 DAY), DATE_SUB(CURDATE(), INTERVAL 18 DAY), 3, 'Trámite particular y renovación de carnet', 'aprobada', 1, 'Presentó constancia oficial'),
(3, 4, 'capacitacion', DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 2, 'Curso de manejo defensivo y primeros auxilios en ruta', 'aprobada', 1, 'Organizado por Seguridad Vial San Juan');

