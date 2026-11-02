# 05 — API RESTful, Contratos y Endpoints

## Buenas Prácticas y Contratos HTTP
- [ ] **Sincronización cliente ↔ backend**: Cada endpoint consumido por los controladores en `src/frontend/scripts/` coincide exactamente en método HTTP (`GET`, `POST`, `PUT`, `DELETE`), URL relativa (`/api/...`) y firma de datos con `src/pages/api/`.
- [ ] **Códigos de estado HTTP semánticos**:
  - `200 OK`: Respuestas de consulta exitosa y actualizaciones completas.
  - `201 Created`: Creación exitosa de recursos (ej. nueva comisión, carga de combustible, nuevo vehículo).
  - `400 Bad Request`: Errores de validación de datos de entrada o negocio con mensaje descriptivo.
  - `401 Unauthorized` / `403 Forbidden`: Acceso no autenticado o falta de permisos por rol.
  - `404 Not Found`: Recurso no encontrado.
  - `500 Internal Server Error`: Fallos no controlados sin exponer stack traces internas en producción.
- [ ] **Formato uniforme de respuesta**: Respuestas JSON consistentes bajo la estructura `{ success: boolean, data?: any, error?: string }` o formato estándar de API.
- [ ] **Validación estricta de payloads (Anti Mass-Assignment)**: Parámetros del cuerpo de peticiones `POST`/`PUT` validados y mapeados a interfaces TypeScript explícitas, impidiendo la mutación de campos protegidos como `id`, `created_at` o roles de usuario.
- [ ] **Cabeceras HTTP explícitas**: Cabeceras `Content-Type: application/json; charset=utf-8` definidas en todas las respuestas de endpoints API.
- [ ] **Sanitización y control de archivos adjuntos**: Validación de tipo MIME y tamaño máximo en endpoints de subida de tickets fotográficos (`/api/analizar-ticket`, `/api/analizar-tablero`).
