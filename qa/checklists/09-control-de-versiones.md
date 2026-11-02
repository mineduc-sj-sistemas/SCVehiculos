# 09 — Control de Versiones

## Buenas Prácticas de Versionado
- [ ] **Estandarización de commits convencionales (Actual: 80%)**: Homogeneizar los mensajes de commit bajo la convención SemVer / Angular (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`, `test:`), corrigiendo el 20% de commits libres o no estructurados.
- [ ] **Etiquetado formal de versiones (Tags) (Actual: 0 tags)**: Crear tags versionados (ej. `v1.0.0`) correspondientes a las entregas estables y despliegues a producción.
- [ ] **Estrategia de ramas y revisiones (Pull Requests)**: Mantener un flujo de integración ordenado (`main` protegido, ramas por funcionalidad `feature/...` o corrección `fix/...`).
- [ ] **Configuración de exclusiones (.gitignore)**: Verificar que `.gitignore` excluya dependencias (`node_modules`), compilados (`dist/`, `tsconfig.tsbuildinfo`), archivos `.env` con credenciales reales y volcados locales.
- [ ] **Privacidad de herramientas de auditoría**: Reglas de exclusión locales configuradas (`.git/info/exclude`) para resguardar las herramientas privadas de auditoría (`qa/scripts/`, `qa/skills/`, etc.) sin ensuciar el repositorio compartido.
- [ ] **Repositorio libre de binarios pesados**: Evaluar el versionado de PDFs pesados (`Guia_de_Usuario_SCVehiculos_Administradores_y_Choferes.pdf` ~518 KB) y optimizar imágenes en `public/vehiculos/`.
