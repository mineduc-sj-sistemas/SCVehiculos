# Ranking de complejidad — SCVehiculos

> Generado: 2026-11-02 · commit `7ec3fef` · rama `main`

## Vistas y Componentes Astro (umbral 500 lín · crítico 800 lín)

Archivos: 56 · sobre umbral: **6** · críticos: **1**

| Líneas | Estado | Archivo | Acceso a datos |
|---:|---|---|---|
| 916 | 🔴 Crítico | `src/frontend/components/auditoria/AuditorExecutiveView.astro` | — |
| 800 | 🟡 Sobre umbral | `src/pages/mi-viaje.astro` | — |
| 718 | 🟡 Sobre umbral | `src/pages/viajes-choferes.astro` | — |
| 674 | 🟡 Sobre umbral | `src/frontend/components/flota/VehicleDetailModal.astro` | — |
| 602 | 🟡 Sobre umbral | `src/frontend/components/flota/VehicleFormModal.astro` | — |
| 580 | 🟡 Sobre umbral | `src/frontend/components/cronograma/CronogramaDispatchModal.astro` | — |
| 497 | 🔵 Moderado | `src/frontend/components/choferes/ChoferFormModal.astro` | — |
| 429 | 🔵 Moderado | `src/frontend/components/pwa/PwaManager.astro` | — |
| 375 | 🔵 Moderado | `src/pages/index.astro` | — |
| 350 | 🔵 Moderado | `src/pages/cronograma/imprimir/[id].astro` | — |
| 332 | 🔵 Moderado | `src/frontend/components/combustible/FuelFormModal.astro` | — |
| 282 | 🟢 Óptimo | `src/frontend/components/choferes/ChoferDetailModal.astro` | — |
| 271 | 🟢 Óptimo | `src/frontend/components/usuarios/UserFormModal.astro` | — |
| 259 | 🟢 Óptimo | `src/frontend/components/cronograma/CronogramaDetailModal.astro` | — |
| 253 | 🟢 Óptimo | `src/frontend/components/cronograma/CronogramaGrid.astro` | — |
| 244 | 🟢 Óptimo | `src/frontend/components/mantenimientos/MaintenanceFormModal.astro` | — |
| 226 | 🟢 Óptimo | `src/pages/mi-perfil.astro` | — |
| 216 | 🟢 Óptimo | `src/frontend/components/mantenimientos/MaintenanceTable.astro` | — |
| 213 | 🟢 Óptimo | `src/pages/login.astro` | — |
| 205 | 🟢 Óptimo | `src/frontend/components/combustible/FuelTable.astro` | — |
| 194 | 🟢 Óptimo | `src/frontend/components/viajes/ViajesTable.astro` | — |
| 192 | 🟢 Óptimo | `src/frontend/components/flota/VehicleCardGrid.astro` | — |
| 184 | 🟢 Óptimo | `src/frontend/components/choferes/ChoferTable.astro` | — |
| 184 | 🟢 Óptimo | `src/frontend/components/cronograma/CronogramaHeader.astro` | — |
| 172 | 🟢 Óptimo | `src/frontend/components/flota/VehicleTable.astro` | — |
| 166 | 🟢 Óptimo | `src/frontend/components/mantenimientos/MaintenanceFinishModal.astro` | — |
| 163 | 🟢 Óptimo | `src/frontend/components/layout/Header.astro` | — |
| 159 | 🟢 Óptimo | `src/frontend/components/ui/ToastNotification.astro` | — |
| 158 | 🟢 Óptimo | `src/frontend/components/flota/VehicleGraphic.astro` | — |
| 154 | 🟢 Óptimo | `src/frontend/components/layout/Sidebar.astro` | — |

**Acción sugerida:** Extraer subcomponentes o modularizar lógica visual

## Endpoints API Backend (umbral 200 lín · crítico 300 lín)

Archivos: 18 · sobre umbral: **0** · críticos: **0** · con acceso directo a datos: **2**

| Líneas | Estado | Archivo | Acceso a datos |
|---:|---|---|---|
| 177 | 🔵 Moderado | `src/pages/api/cronograma/[id].ts` | — |
| 126 | 🔵 Moderado | `src/pages/api/combustible/index.ts` | `SELECT ` (L69) |
| 95 | 🟢 Óptimo | `src/pages/api/cronograma/index.ts` | — |
| 91 | 🟢 Óptimo | `src/pages/api/analizar-tablero/index.ts` | — |
| 89 | 🟢 Óptimo | `src/pages/api/mantenimientos/index.ts` | — |
| 84 | 🟢 Óptimo | `src/pages/api/choferes/index.ts` | — |
| 84 | 🟢 Óptimo | `src/pages/api/vehiculos/index.ts` | — |
| 71 | 🟢 Óptimo | `src/pages/api/analizar-ticket/index.ts` | — |
| 68 | 🟢 Óptimo | `src/pages/api/reportes/[tipo].ts` | — |
| 64 | 🟢 Óptimo | `src/pages/api/mantenimientos/[id].ts` | — |
| 58 | 🟢 Óptimo | `src/pages/api/chofer/checkin.ts` | — |
| 57 | 🟢 Óptimo | `src/pages/api/usuarios/index.ts` | — |
| 52 | 🟢 Óptimo | `src/pages/api/auth/login.ts` | — |
| 45 | 🟢 Óptimo | `src/pages/api/choferes/licencias.ts` | — |
| 37 | 🟢 Óptimo | `src/pages/api/chofer/mi-viaje.ts` | — |
| 34 | 🟢 Óptimo | `src/pages/api/alertas/index.ts` | `SELECT ` (L14) |
| 32 | 🟢 Óptimo | `src/pages/api/chofer/viajes-asignados.ts` | — |
| 16 | 🟢 Óptimo | `src/pages/api/auth/logout.ts` | — |

## Servicios Backend (Dominio y Datos) (umbral 300 lín · crítico 500 lín)

Archivos: 15 · sobre umbral: **9** · críticos: **3**

| Líneas | Estado | Archivo | Acceso a datos |
|---:|---|---|---|
| 1192 | 🔴 Crítico | `src/backend/services/cronogramaService.ts` | — |
| 623 | 🔴 Crítico | `src/backend/services/vehicleService.ts` | — |
| 552 | 🔴 Crítico | `src/backend/services/choferService.ts` | — |
| 454 | 🟡 Sobre umbral | `src/backend/services/choferViajesService.ts` | — |
| 394 | 🟡 Sobre umbral | `src/backend/services/visionService.ts` | — |
| 375 | 🟡 Sobre umbral | `src/backend/services/alertService.ts` | — |
| 375 | 🟡 Sobre umbral | `src/backend/services/maintenanceService.ts` | — |
| 355 | 🟡 Sobre umbral | `src/backend/services/userService.ts` | — |
| 338 | 🟡 Sobre umbral | `src/backend/services/authService.ts` | — |
| 298 | 🔵 Moderado | `src/backend/services/fuelService.ts` | — |
| 255 | 🔵 Moderado | `src/backend/services/viajesService.ts` | — |
| 242 | 🔵 Moderado | `src/backend/services/choferPortalService.ts` | — |
| 222 | 🔵 Moderado | `src/backend/services/dashboardService.ts` | — |
| 197 | 🔵 Moderado | `src/backend/services/choferPerfilService.ts` | — |
| 185 | 🔵 Moderado | `src/backend/services/reportService.ts` | — |

**Acción sugerida:** Dividir responsabilidades y consultas en módulos cohesivos

## Controladores Frontend (Scripts Cliente) (umbral 300 lín · crítico 500 lín)

Archivos: 9 · sobre umbral: **6** · críticos: **4**

| Líneas | Estado | Archivo | Acceso a datos |
|---:|---|---|---|
| 1622 | 🔴 Crítico | `src/frontend/scripts/cronogramaController.ts` | — |
| 1250 | 🔴 Crítico | `src/frontend/scripts/choferesController.ts` | — |
| 1190 | 🔴 Crítico | `src/frontend/scripts/viajesController.ts` | — |
| 770 | 🔴 Crítico | `src/frontend/scripts/miViajeController.ts` | — |
| 428 | 🟡 Sobre umbral | `src/frontend/scripts/combustibleController.ts` | — |
| 415 | 🟡 Sobre umbral | `src/frontend/scripts/viajesChoferesController.ts` | — |
| 280 | 🔵 Moderado | `src/frontend/scripts/mantenimientosController.ts` | — |
| 202 | 🔵 Moderado | `src/frontend/scripts/flotaController.ts` | — |
| 171 | 🟢 Óptimo | `src/frontend/scripts/userController.ts` | — |

**Acción sugerida:** Modularizar controladores de pantalla en submódulos o handlers de eventos

## Control de versiones

- Commits totales: 48
- Convención de commits (últimos 46): **80%**
- Tags: 0 — **sin tags de versión**
- Ejemplos sin convención:
  - "Mejora en sidebar y formulario wizard - Augusto"
  - "Mejora en colores modo oscuro - Augusto"
  - "boton de editar en las comisiones"
  - "añadir rol de auditor, vista de panel ejecutivo y actualizar autorizaciones de rutas"
  - "cambios en el frontend"

## Documentación

- Última actualización de docs (README.md, README_DOCKER.md, MEJORAS_25_09.md, docs): nunca
- Último cambio de código: —
- Commits de código desde la última actualización de docs: **—**
