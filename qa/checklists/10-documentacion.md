# 10 — Documentación Técnica y Funcional

## Buenas Prácticas de Documentación
- [ ] **Manual de instalación y arranque actualizado**: El archivo `README.md` describe con precisión los requisitos previos (Node.js 20+, MySQL 8+, Astro 7) y comandos de instalación (`npm install`, `npm run dev`, `npm run start`).
- [ ] **Documentación de entorno Docker y despliegue**: `README_DOCKER.md` y `docker-compose.yml` contienen variables de entorno claras y pasos para levantar la base de datos y la aplicación en contenedores.
- [ ] **Registro de decisiones y mejoras arquitectónicas**: El documento `MEJORAS_25_09.md` documenta los hitos y optimizaciones aplicadas al flujo de despacho y perfiles de chofer.
- [ ] **Manuales de usuario por rol**: Se dispone de `Guia_de_Usuario_SCVehiculos_Administradores_y_Choferes.pdf` para capacitación operativa de choferes y administradores.
- [ ] **Documentación técnica de contratos de API**: Detalle de endpoints HTTP bajo `src/pages/api/` con sus parámetros esperados y respuestas de error documentadas en el repositorio.
- [ ] **Diccionario de datos y esquema relacional**: Mantener documentación descriptiva de las tablas, relaciones e índices del esquema MySQL (`database/schema.sql`).
