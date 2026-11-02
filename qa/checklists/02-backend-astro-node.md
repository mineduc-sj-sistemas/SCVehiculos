# 02 — Backend y Arquitectura (Astro SSR & Node.js)

## Buenas Prácticas y Arquitectura
- [ ] **Capas y separación de responsabilidades**: Separación estricta entre Adaptadores HTTP (`src/pages/api/`), Servicios de Dominio (`src/backend/services/`) y Capa de Datos (`src/backend/config/db.ts`).
- [ ] **Controladores delgados (Endpoints API < 200 lín)**: Los endpoints en `src/pages/api/` solo parsean la petición, validan parámetros y formatean la respuesta HTTP.
- [ ] **Cero acceso directo a datos en endpoints**: Prohibido invocar `query(...)`, `pool.execute(...)` o escribir sentencias SQL directamente en archivos bajo `src/pages/api/`; toda consulta a base de datos debe residir en `src/backend/services/`.
- [ ] **Validación de esquemas y payloads**: Validación exhaustiva de parámetros de entrada antes de invocar la capa de negocio; prevención de inyección o valores inválidos.
- [ ] **Manejo uniforme de errores y respuestas HTTP**: Respuestas JSON estructuradas con `{ success: boolean, data?: any, error?: string }` y códigos HTTP representativos (`200`, `201`, `400`, `401`, `403`, `404`, `500`).
- [ ] **Manejo transaccional ACID seguro**: Operaciones críticas compuestas (ej. asignación de vehículos, registro de despachos con cambio de estado) deben ejecutarse mediante `withTransaction(...)` con rollback automático ante excepciones.
- [ ] **Centralización de variables de entorno**: Validación de configuración al inicio (variables de MySQL `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, JWT/secretos) sin valores hardcodeados en el código.
- [ ] **Logging estructurado**: Registro de eventos operativos y errores con trazabilidad semántica evitando `console.log` dispersos o no estructurados en producción.

## Hallazgos de la Medición (Archivos sobre Umbral y Deuda de Datos)
- [ ] **Corregir acceso directo a SQL en `src/pages/api/combustible/index.ts` (L69)**: Eliminar la sentencia directa `SELECT odometro_actual FROM vehiculos WHERE id = ?` en el endpoint y delegar la obtención a `fuelService` o `vehicleService`.
- [ ] **Dividir `src/backend/services/cronogramaService.ts` (1192 lín - 🔴 Crítico)**: Extraer cálculo de matrices semanales y fechas a un helper temporal, y segregar la lógica de despacho transaccional y validación de conflictos en submódulos dedicados.
- [ ] **Dividir `src/backend/services/vehicleService.ts` (623 lín - 🔴 Crítico)**: Separar consultas de ficha 360°, auditoría de estados y operaciones CRUD base en módulos específicos.
- [ ] **Dividir `src/backend/services/choferService.ts` (552 lín - 🔴 Crítico)**: Extraer gestión de licencias y validaciones de vigencia hacia un servicio modular de licencias.
- [ ] **Modularizar `src/backend/services/choferViajesService.ts` (454 lín - 🟡 Sobre umbral)**: Segregar flujos de check-in y confirmación de viajes de la consulta de histórico.
- [ ] **Modularizar `src/backend/services/visionService.ts` (394 lín - 🟡 Sobre umbral)**: Desacoplar el cliente de OCR/Google Vision de las reglas de sanitización de importes y odómetros.
- [ ] **Modularizar `src/backend/services/alertService.ts` (375 lín - 🟡 Sobre umbral)**: Extraer reglas de cálculo de vencimientos preventivos a evaluadores unitarios.
- [ ] **Modularizar `src/backend/services/maintenanceService.ts` (375 lín - 🟡 Sobre umbral)**: Separar gestión de órdenes de taller de la actualización de odómetro y estados del vehículo.
- [ ] **Modularizar `src/backend/services/userService.ts` (355 lín - 🟡 Sobre umbral)**: Segregar asignación de roles y permisos de la gestión de credenciales.
- [ ] **Modularizar `src/backend/services/authService.ts` (338 lín - 🟡 Sobre umbral)**: Separar validación de credenciales y hashing de la emisión y verificación de tokens/sesiones.
