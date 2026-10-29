-- =====================================================================
-- Datos Semilla (Seed Dinámico): sc_vehiculos
-- Coherente con los datos de la interfaz de SCVehiculos
-- Utiliza fechas relativas para mantenerse siempre vigente
-- =====================================================================

USE `sc_vehiculos`;
SET NAMES utf8mb4;

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
(4, 'Chofer', 'Consulta de hojas de ruta asignadas'),
(5, 'Auditor', 'Lectura de estadísticas, auditoría e informes de gestión');

-- 2. Dependencias del Ministerio de Educación
INSERT INTO `dependencias` (`id`, `nombre`, `sigla`, `responsable`, `telefono`, `email`) VALUES
(1, 'Dirección de Educación Rural', 'DER', 'Lic. Patricia Albarracín', '264-4305010', 'educacion.rural@sanjuan.edu.ar'),
(2, 'Supervisión Zona Norte', 'SZN', 'Prof. Roberto Castro', '264-4305022', 'supervision.norte@sanjuan.edu.ar'),
(3, 'Dirección de Infraestructura Escolar', 'DIE', 'Arq. Marcelo Quiroga', '264-4305045', 'infraestructura.escolar@sanjuan.edu.ar'),
(4, 'Dirección de Educación Primaria', 'DEP', 'Prof. Silvia Fernández', '264-4305030', 'educacion.primaria@sanjuan.edu.ar'),
(5, 'Dirección de Educación Secundaria', 'DES', 'Prof. Alejandro Morales', '264-4305035', 'educacion.secundaria@sanjuan.edu.ar');

-- 3. Usuario Administrador Inicial (Password: admin123)
INSERT INTO `usuarios` (`id`, `rol_id`, `dependencia_id`, `nombre`, `apellido`, `email`, `password_hash`, `dni`, `telefono`, `activo`) VALUES
(1, 1, NULL, 'Aníbal', 'Administrador', 'anibal@sanjuanadmin', '$2b$10$476RAYizCI0NW.M6lBaX6OxR9vtFjtA3de9wSx/WkeTBTDZcYGHda', '25112233', '264-4801122', 1);

-- 4. Tipos de Vehículo (Catálogo base)
INSERT INTO `tipos_vehiculo` (`id`, `nombre`, `descripcion`) VALUES
(1, 'Camioneta', 'Pick-up 4x2 o 4x4 para caminos de montaña y rurales'),
(2, 'Utilitario', 'Furgón pequeño para carga ligera y logística escolar'),
(3, 'Sedán', 'Vehículo de pasajeros para traslados urbanos y protocolares'),
(4, 'Minibús', 'Transporte de contingentes y delegaciones educativas'),
(5, 'Camión', 'Camión de carga pesada para distribución de mobiliario escolar'),
(6, 'SUV', 'Vehículo utilitario deportivo para supervisión pedagógica');


