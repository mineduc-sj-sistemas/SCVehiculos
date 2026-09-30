-- Migración 004: Índices compuestos para optimización de prevención de solapamiento horario en comisiones
-- Base de datos: sc_vehiculos

USE `sc_vehiculos`;

-- Índice compuesto para solapamiento de vehículo
SET @exist_idx_veh := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comisiones'
    AND INDEX_NAME = 'idx_comisiones_solapamiento_vehiculo'
);

SET @sql_veh := IF(@exist_idx_veh = 0,
  'CREATE INDEX idx_comisiones_solapamiento_vehiculo ON comisiones (vehiculo_id, estado, fecha_salida_programada, fecha_regreso_estimada)',
  'SELECT "Index idx_comisiones_solapamiento_vehiculo already exists"'
);
PREPARE stmt_veh FROM @sql_veh;
EXECUTE stmt_veh;
DEALLOCATE PREPARE stmt_veh;

-- Índice compuesto para solapamiento de chofer
SET @exist_idx_chofer := (
  SELECT COUNT(1) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'comisiones'
    AND INDEX_NAME = 'idx_comisiones_solapamiento_chofer'
);

SET @sql_chofer := IF(@exist_idx_chofer = 0,
  'CREATE INDEX idx_comisiones_solapamiento_chofer ON comisiones (chofer_id, estado, fecha_salida_programada, fecha_regreso_estimada)',
  'SELECT "Index idx_comisiones_solapamiento_chofer already exists"'
);
PREPARE stmt_chofer FROM @sql_chofer;
EXECUTE stmt_chofer;
DEALLOCATE PREPARE stmt_chofer;
