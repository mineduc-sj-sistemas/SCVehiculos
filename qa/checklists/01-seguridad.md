# 01 — Seguridad y Control de Accesos

- [ ] **Control horizontal (BOLA / IDOR)**: El identificador del usuario/titular sale exclusivamente de la sesión/token autenticado, nunca de params, body o query string.
- [ ] **Control vertical por rol (RBAC)**: Toda ruta operativa exige autenticación y autorización explícita por rol; solo endpoints públicos declarados están exentos. Acciones administrativas y dictámenes restringidos a roles autorizados.
- [ ] **Autenticación y sesiones**: Sin credenciales maestras, bypasses ni headers de prueba (`x-test-*`) en código productivo. Alta de cuentas con verificación de identidad.
- [ ] **Gestión de secretos y firmas**: Claves de firma y tokens leídos de variables de entorno seguras (sin fallbacks inseguros ni hardcoded en repositorio). Contraseñas almacenadas con algoritmos seguros y factor de costo adecuado.
- [ ] **CORS y cabeceras de red**: CORS acotado estrictamente a los dominios autorizados en producción. Cabeceras HTTP de seguridad configuradas (`X-Content-Type-Options: nosniff`, `X-Frame-Options`, etc.).
- [ ] **Carga de archivos y adjuntos**: Verificación de extensiones permitidas, validación de firma/magic bytes, límite de tamaño por archivo y almacenamiento con nombres generados por el servidor para evitar Path Traversal.
- [ ] **Prevención de inyección y XSS**: Consultas a base de datos parametrizadas (sin concatenación de SQL). Renderizado en frontend sanitizado, evitando inyección de HTML crudo.
- [ ] **Manejo seguro de excepciones y logs**: Respuestas en producción sin exponer detalles internos, rutas ni stack traces. Logs estructurados sin almacenar contraseñas, tokens ni datos personales sensibles.
- [ ] **Auditoría de dependencias**: Sin dependencias con vulnerabilidades de severidad alta o crítica reportadas en el gestor de paquetes.
