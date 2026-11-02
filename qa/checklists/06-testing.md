# 06 — Testing y Verificación Automatizada

- [ ] **Suite de pruebas unitarias**: Pruebas automáticas implementadas para la lógica de dominio pura y reglas de cálculo o parsing críticas del negocio.
- [ ] **Pruebas de máquina de estados**: Cobertura de transiciones válidas e inválidas en los flujos principales del sistema.
- [ ] **Pruebas de autorización y roles (RBAC)**: Casos de prueba que confirman denegación de acceso (`401 / 403`) para usuarios no autenticados o con rol insuficiente.
- [ ] **Aislamiento total de entornos productivos**: Las pruebas automatizadas nunca se ejecutan contra bases de datos reales ni consumen APIs de terceros de producción.
- [ ] **Uso de base de datos efímera**: Pruebas de integración ejecutadas contra bases de datos en memoria, SQLite o contenedores efímeros desechables.
- [ ] **Datos ficticios de prueba**: Ningún archivo de test contiene datos personales reales ni secretos institucionales.
