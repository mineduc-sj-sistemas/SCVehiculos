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
  `marca` VARCHAR(50) NOT NULL,
  `modelo` VARCHAR(100) NOT NULL,
  `version` VARCHAR(100) NULL,
  `anio` SMALLINT UNSIGNED NULL,
  `numero_chasis` VARCHAR(50) NULL,
  `numero_motor` VARCHAR(50) NULL,
  `numero_cedula` VARCHAR(50) NULL,
  `fecha_vencimiento_cedula` DATE NULL,
  `tipo_combustible` ENUM('nafta_super', 'nafta_premium', 'diesel_500', 'diesel_grado_3', 'gnc', 'hibrido', 'electrico') NOT NULL DEFAULT 'diesel_500',
  `capacidad_tanque_litros` DECIMAL(6,2) NULL,
  `capacidad_pasajeros` TINYINT UNSIGNED NULL DEFAULT 5,
  `odometro_actual` INT UNSIGNED NOT NULL DEFAULT 0,
  `numero_rto` VARCHAR(50) NULL,
  `fecha_vencimiento_vtv` DATE NOT NULL,
  `compania_seguro` VARCHAR(100) NULL,
  `numero_poliza` VARCHAR(100) NULL,
  `fecha_vencimiento_seguro` DATE NULL,
  `estado` ENUM('disponible', 'en_comision', 'en_taller', 'baja') NOT NULL DEFAULT 'disponible',
  `observaciones` TEXT NULL,
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
  `destino` VARCHAR(150) NOT NULL,
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

-- Reactivar chequeo de foreign keys
SET FOREIGN_KEY_CHECKS = 1;

