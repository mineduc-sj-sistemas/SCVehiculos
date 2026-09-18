-- =====================================================================
-- Datos Semilla (Seed Dinámico): sc_vehiculos
-- Coherente con los datos de la interfaz de SCVehiculos
-- Utiliza fechas relativas para mantenerse siempre vigente
-- =====================================================================

USE `sc_vehiculos`;

SET FOREIGN_KEY_CHECKS = 0;

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
(3, 'Mecánico / Taller', 'Registro y seguimiento de servicios de mantenimiento'),
(4, 'Chofer', 'Consulta de hojas de ruta asignadas'),
(5, 'Auditor', 'Lectura de estadísticas e informes de uso');

-- 2. Dependencias del Ministerio de Educación
INSERT INTO `dependencias` (`id`, `nombre`, `sigla`, `responsable`, `telefono`, `email`) VALUES
(1, 'Dirección de Educación Rural', 'DER', 'Lic. Patricia Albarracín', '264-4305010', 'educacion.rural@sanjuan.edu.ar'),
(2, 'Supervisión Zona Norte', 'SZN', 'Prof. Roberto Castro', '264-4305022', 'supervision.norte@sanjuan.edu.ar'),
(3, 'Dirección de Infraestructura Escolar', 'DIE', 'Arq. Marcelo Quiroga', '264-4305045', 'infraestructura.escolar@sanjuan.edu.ar'),
(4, 'Dirección de Educación Primaria', 'DEP', 'Prof. Silvia Fernández', '264-4305030', 'educacion.primaria@sanjuan.edu.ar'),
(5, 'Dirección de Educación Secundaria', 'DES', 'Prof. Alejandro Morales', '264-4305035', 'educacion.secundaria@sanjuan.edu.ar');

-- 3. Usuarios iniciales (Password demo)
INSERT INTO `usuarios` (`id`, `rol_id`, `dependencia_id`, `nombre`, `apellido`, `email`, `password_hash`, `dni`, `telefono`, `activo`) VALUES
(1, 1, NULL, 'María', 'Gutiérrez', 'maria.gutierrez@sanjuan.edu.ar', '$2y$10$e79qW5zF9E0uL3BfA1Pz4u3F8F9xX0Z1vV2kL3mM4nO5pQ6rS7tUu', '27456789', '264-5012345', 1),
(2, 2, NULL, 'Gonzalo', 'Pérez', 'gonzalo.perez@sanjuan.edu.ar', '$2y$10$e79qW5zF9E0uL3BfA1Pz4u3F8F9xX0Z1vV2kL3mM4nO5pQ6rS7tUu', '32145678', '264-5023456', 1);

-- 4. Choferes con vencimientos relativos
INSERT INTO `choferes` (`id`, `usuario_id`, `nombre`, `apellido`, `dni`, `cuil`, `telefono`, `email`, `direccion`, `numero_licencia`, `categoria_licencia`, `fecha_vencimiento_licencia`, `estado`, `observaciones`) VALUES
(1, NULL, 'Martín', 'Rojas', '28456123', '20-28456123-7', '264-4112233', 'martin.rojas@gmail.com', 'Capital, San Juan', 'SJ-28456123', 'B2', DATE_ADD(CURDATE(), INTERVAL 320 DAY), 'en_comision', 'Chofer asignado a viajes interdepartamentales'),
(2, NULL, 'Lucía', 'Gómez', '31789456', '27-31789456-4', '264-4223344', 'lucia.gomez@gmail.com', 'Rivadavia, San Juan', 'SJ-31789456', 'D1', DATE_ADD(CURDATE(), INTERVAL 240 DAY), 'en_comision', 'Licencia profesional para transporte de pasajeros'),
(3, NULL, 'Carlos', 'Molina', '25987654', '20-25987654-2', '264-4334455', 'carlos.molina@gmail.com', 'Santa Lucía, San Juan', 'SJ-25987654', 'B1', DATE_ADD(CURDATE(), INTERVAL 14 DAY), 'disponible', 'Carnet próximo a vencer (aviso automático emitido)'),
(4, NULL, 'Esteban', 'Paredes', '29345678', '20-29345678-9', '264-4445566', 'esteban.paredes@gmail.com', 'Rawson, San Juan', 'SJ-29345678', 'B2', DATE_ADD(CURDATE(), INTERVAL 450 DAY), 'disponible', NULL),
(5, NULL, 'Javier', 'Salinas', '33456789', '20-33456789-1', '264-4556677', 'javier.salinas@gmail.com', 'Chimbas, San Juan', 'SJ-33456789', 'B1', DATE_ADD(CURDATE(), INTERVAL 22 DAY), 'disponible', 'Turno renovación asignado');

-- 5. Tipos de Vehículo
INSERT INTO `tipos_vehiculo` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Camioneta', 'Pick-up 4x2 o 4x4 para caminos de montaña y rurales'),
(2, 'Utilitario', 'Furgón pequeño para carga ligera y logística escolar'),
(3, 'Sedán', 'Vehículo de pasajeros para traslados urbanos y protocolares'),
(4, 'Minibús', 'Transporte de contingentes y delegaciones educativas');

-- 6. Vehículos (Flota oficial) con VTV relativas, Cédula y RTO
INSERT INTO `vehiculos` (`id`, `patente`, `tipo_vehiculo_id`, `dependencia_id`, `marca`, `modelo`, `version`, `anio`, `numero_chasis`, `numero_motor`, `numero_cedula`, `tipo_combustible`, `capacidad_tanque_litros`, `capacidad_pasajeros`, `odometro_actual`, `numero_rto`, `fecha_vencimiento_vtv`, `compania_seguro`, `numero_poliza`, `fecha_vencimiento_seguro`, `estado`, `observaciones`) VALUES
(1, 'AB 123 CD', 1, 1, 'Toyota', 'Hilux', 'DX 2.4 TDI 4x4', 2021, '8AJHA3CD5M1001234', '2GD4567890', 'CV-09412356', 'diesel_grado_3', 80.00, 5, 45890, 'RTO-SJ-2024-8841', DATE_ADD(CURDATE(), INTERVAL 32 DAY), 'Nación Seguros', 'POL-784512-SJ', DATE_ADD(CURDATE(), INTERVAL 200 DAY), 'disponible', 'Asignada a recorridos rurales'),
(2, 'AC 847 EF', 2, 3, 'Renault', 'Kangoo Furgón', 'Express 1.5 dCi', 2022, '8A1VF8EF6N2005678', 'K9K1234567', 'CV-09854123', 'diesel_grado_3', 50.00, 2, 82640, 'RTO-SJ-2024-9120', DATE_ADD(CURDATE(), INTERVAL 55 DAY), 'Nación Seguros', 'POL-784513-SJ', DATE_ADD(CURDATE(), INTERVAL 240 DAY), 'en_comision', 'Logística de infraestructura y mantenimiento escolar'),
(3, 'AD 592 GH', 1, 1, 'Ford', 'Ranger', 'XLT 3.2 4x4', 2020, '8AFBR2GH4L3009012', 'P5AT7654321', 'CV-08745129', 'diesel_grado_3', 80.00, 5, 61930, 'RTO-SJ-2024-7412', DATE_ADD(CURDATE(), INTERVAL 18 DAY), 'Nación Seguros', 'POL-784514-SJ', DATE_ADD(CURDATE(), INTERVAL 190 DAY), 'en_taller', 'En taller para cambio de fluidos y revisión de suspensión'),
(4, 'AE 312 IJ', 3, NULL, 'Fiat', 'Cronos', 'Precision 1.8 AT', 2023, '8APAF1IJ7P4003456', 'E-TORQ987654', 'CV-10452387', 'nafta_super', 48.00, 5, 32110, 'RTO-SJ-2024-6590', DATE_ADD(CURDATE(), INTERVAL 95 DAY), 'Nación Seguros', 'POL-784515-SJ', DATE_ADD(CURDATE(), INTERVAL 310 DAY), 'disponible', 'Uso en traslados oficiales en Gran San Juan'),
(5, 'AF 765 KL', 4, 2, 'Mercedes-Benz', 'Sprinter', '516 CDI 19+1', 2022, '8AC906KL8R5007890', 'OM651234567', 'CV-09963254', 'diesel_grado_3', 75.00, 20, 104520, 'RTO-SJ-2024-8114', DATE_ADD(CURDATE(), INTERVAL 23 DAY), 'Nación Seguros', 'POL-784516-SJ', DATE_ADD(CURDATE(), INTERVAL 280 DAY), 'en_comision', 'Transporte de supervisores y delegaciones docentes');

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

