# 04 — Base de Datos y Persistencia (MySQL 8.0+ / InnoDB)

## Buenas Prácticas y Rendimiento
- [ ] **Esquema versionado y migraciones ordenadas**: Cambios de estructura gestionados exclusivamente a través de scripts DDL versionados en `database/schema.sql` y migraciones reproducibles sin scripts manuales ad-hoc.
- [ ] **Configuración de juego de caracteres utf8mb4**: Tablas, columnas de texto y conexiones de pool configuradas estrictamente con `utf8mb4` / `utf8mb4_unicode_ci` para soporte completo de caracteres y tildes.
- [ ] **Uso de Connection Pooling**: Configuración y reutilización eficiente del pool de conexiones `mysql2/promise` (`connectionLimit`, `waitForConnections: true`, `queueLimit`) sin crear conexiones volátiles por petición.
- [ ] **Consultas preparadas obligatorias**: Toda consulta con parámetros externos debe usar prepared statements (`execute(sql, [params])`) para prevenir inyecciones SQL.
- [ ] **Transaccionalidad ACID**: Operaciones multi-tabla (ej. creación de comisiones con actualización del estado del vehículo en `vehiculos` y registro en `auditoria_estados_vehiculo`) deben ejecutarse dentro de `withTransaction` con `START TRANSACTION`, `COMMIT` y `ROLLBACK` garantizado ante fallos.
- [ ] **Proyecciones acotadas de columnas**: Evitar consultas indiscriminadas con `SELECT *` en listados masivos de comisiones o combustible; seleccionar únicamente los campos necesarios para la vista o reporte.
- [ ] **Cobertura de índices en columnas de búsqueda frecuente**:
  - `vehiculos`: índices en `patente`, `estado`, `id_dependencia`, `id_tipo`.
  - `comisiones`: índices compuestos en `(fecha_inicio, fecha_fin)`, `estado`, `id_vehiculo`, `id_chofer`.
  - `cargas_combustible`: índices en `fecha_carga`, `id_vehiculo`, `id_chofer`.
  - `mantenimientos`: índices en `fecha_mantenimiento`, `id_vehiculo`, `estado`.
  - `licencias_chofer`: índice en `(id_chofer, fecha_vencimiento)`.
- [ ] **Integridad referencial y claves foráneas**: Restricciones de clave foránea (`FOREIGN KEY`) explícitas con `ON DELETE RESTRICT` en registros históricos (comisiones, combustible, auditoría) para evitar borrados accidentales en cascada.
- [ ] **Trazabilidad inmutable de estados**: Registro automático e inmutable en `auditoria_estados_vehiculo` de cada transición de estado (`DISPONIBLE`, `EN_COMISION`, `EN_TALLER`, `FUERA_DE_SERVICIO`) con usuario, motivo y fecha.
