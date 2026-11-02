# Registro de Deuda Técnica (fuente de verdad)

Los IDs **no cambian** entre auditorías. Estados: Abierto · En progreso · Parcial · Resuelto · Discutido · Riesgo aceptado · Regresión.
Alcance vigente: ver `alcance.md`. Última actualización: 2026-11-02 · commit `7ec3fef`.

| ID | Sev. | Área | Título | Regla | Detectado | Estado | Cierre | Tarea |
|---|---|---|---|---|---|---|---|---|
| AUD-001 | Alta | Backend | Acceso directo a SQL en endpoint API de combustible | Cero acceso a datos en endpoints | `src/pages/api/combustible/index.ts:69` | Abierto | — | Extraer query a `fuelService` o `vehicleService` |
| AUD-002 | Media | Backend | Servicio `cronogramaService.ts` supera límite crítico (1192 lín) | Servicios cohesivos y modulares | `src/backend/services/cronogramaService.ts:1` | Abierto | — | Extraer lógica de calendario y dividir despacho |
| AUD-003 | Alta | Frontend | Controladores de cliente cliente masivos (>1000 lín) | Controladores de cliente <300 lín | `src/frontend/scripts/cronogramaController.ts:1`, `src/frontend/scripts/choferesController.ts:1` | Abierto | — | Modularizar llamadas API y handlers de eventos |
| AUD-004 | Media | Frontend | Vista ejecutiva de auditoría supera umbral crítico (916 lín) | Límite de vistas <500 lín | `src/frontend/components/auditoria/AuditorExecutiveView.astro:1` | Abierto | — | Extraer partials de KPIs y tablas |
| AUD-005 | Media | Mantenibilidad | Convivencia simultánea de múltiples gestores de paquetes | Gestor de paquetes unificado | `package-lock.json`, `pnpm-lock.yaml` | Abierto | — | Unificar en npm o pnpm y limpiar lockfile redundante |
| AUD-006 | Baja | Versionado | Repositorio sin etiquetas (tags) de versión formalizadas | Versionado con tags | Git HEAD (0 tags) | Abierto | — | Etiquetar versión base `v1.0.0` |

## Notas privadas para fases futuras (no se auditan hoy)
- Evaluación de rendimiento en carga masiva de imágenes de odómetros y tickets a Google Vision OCR (`visionService.ts`).
- Validación de soporte PWA offline en zonas sin conectividad celular (`PwaManager.astro`).

## Historial de auditorías
| # | Fecha | Commit | Alcance | Semáforo | Críticas | Altas | Medias | Bajas | Resueltas |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-11-02 | 7ec3fef | Flota, Choferes, Cronograma, Combustible y Auditoría | 🟡 GO con riesgos | 0 | 2 | 3 | 1 | 0 |
