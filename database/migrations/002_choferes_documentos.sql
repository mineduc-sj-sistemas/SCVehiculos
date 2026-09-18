-- =====================================================================
-- Migración 002: Soporte para documentos escaneados y múltiples categorías
-- Sistema de Control de Movilidades (SCVehiculos)
-- =====================================================================

USE `sc_vehiculos`;

-- Ampliar longitud de categoría de licencia para admitir múltiples valores (ej: "B1, B2, D1")
ALTER TABLE `choferes`
  MODIFY COLUMN `categoria_licencia` VARCHAR(100) NOT NULL;

-- Agregar columnas para almacenamiento de imágenes o documentos escaneados
ALTER TABLE `choferes`
  ADD COLUMN `foto_dni_frente` LONGTEXT NULL AFTER `direccion`,
  ADD COLUMN `foto_dni_dorso` LONGTEXT NULL AFTER `foto_dni_frente`,
  ADD COLUMN `foto_licencia_frente` LONGTEXT NULL AFTER `fecha_vencimiento_licencia`,
  ADD COLUMN `foto_licencia_dorso` LONGTEXT NULL AFTER `foto_licencia_frente`;
