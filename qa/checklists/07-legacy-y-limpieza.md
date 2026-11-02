# 07 — Legacy, Limpieza y Mantenibilidad

## Limpieza de Repositorio y Código Muerto
- [ ] **Unificación de gestor de paquetes (Lockfiles duplicados)**: Resolver la convivencia conflictiva entre `package-lock.json` (npm) y `pnpm-lock.yaml` / `pnpm-workspace.yaml` (pnpm) en la raíz del proyecto.
- [ ] **Limpieza de colisión de archivos estáticos en `public/vehiculos/`**: Resolver la redundancia entre imágenes JPEG y PNG (`Auto.jpeg`/`auto.png`, `Camion.jpeg`/`camion.png`, etc.) y corregir la colisión de nombres mayúsculas/minúsculas para entornos Windows.
- [ ] **Exclusión de cachés y compilados de TypeScript**: Asegurar que `tsconfig.tsbuildinfo` y carpetas de build (`dist/`) estén debidamente ignoradas en `.gitignore`.
- [ ] **Código libre de bloques comentados y funciones muertas**: Verificar que los servicios en `src/backend/services/` y scripts en `src/frontend/scripts/` no contengan fragmentos extensos de código deshabilitado.
- [ ] **Eliminación de datos ficticios en flujos productivos**: Confirmar que los endpoints en `src/pages/api/` operen contra la base de datos MySQL real y no mantengan payloads dummy hardcodeados.
- [ ] **Una sola fuente canónica de esquemas SQL**: Garantizar que `database/schema.sql` y `database/seed.sql` sean la única referencia canónica de datos iniciales.
- [ ] **Archivos de configuración de despliegue consistentes**: Revisar la concordancia entre `Dockerfile`, `docker-compose.yml`, `docker-compose.dev.yml`, `railway.json` y `render.yaml`.
