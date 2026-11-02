# 03 — Frontend y Experiencia de Usuario (Astro & Tailwind CSS)

## Buenas Prácticas y UI
- [ ] **Límite de tamaño de vistas (< 500 lín)**: Ningún componente `.astro` debe superar las 500 líneas de código; las pantallas extensas deben dividirse en subcomponentes modulares.
- [ ] **Modularidad y subcomponentes (Partials)**: Descomponer vistas complejas en subcomponentes atómicos (`src/frontend/components/`) organizados por dominio funcional (`flota`, `choferes`, `cronograma`, `auditoria`).
- [ ] **Separación limpia de scripts de cliente**: Scripts de interacción de cliente extraídos a archivos `.ts` independientes en `src/frontend/scripts/`, evitando etiquetas `<script>` masivas en archivos `.astro`.
- [ ] **Controladores de cliente contenidos (< 300 lín)**: Los controladores de cliente deben limitarse a coordinar eventos del DOM y delegar la lógica de red o formato a utilidades especializadas.
- [ ] **Control de envíos duplicados**: Botones de acción y formularios deshabilitados durante el envío (`loading`, spinner, estado deshabilitado) para impedir registros repetidos.
- [ ] **Manejo de sesión y expiración**: Verificación en cliente de códigos de error de autenticación (`401/403`) con redirección limpia al login sin recargas infinitas.
- [ ] **Accesibilidad y diseño responsive**: Tablas con scroll horizontal controlado en móviles, etiquetas de accesibilidad en modales y contraste institucional adecuado con Tailwind CSS.
- [ ] **Compilación e integridad de tipos**: Ejecución limpia de `astro check` y `tsc --noEmit` sin errores de compilación ni tipos `any` injustificados.

## Hallazgos de la Medición (Vistas y Scripts sobre Umbral)
- [ ] **Dividir `src/frontend/scripts/cronogramaController.ts` (1622 lín - 🔴 Crítico)**: Extraer gestión de modales, sincronización de filtros de fecha y llamadas a la API de cronograma a módulos separados.
- [ ] **Dividir `src/frontend/scripts/choferesController.ts` (1250 lín - 🔴 Crítico)**: Desacoplar la lógica de gestión de licencias médicas/profesionales de la manipulación de la tabla de choferes.
- [ ] **Dividir `src/frontend/scripts/viajesController.ts` (1190 lín - 🔴 Crítico)**: Separar controladores de eventos de filtros, exportación de reportes y modal de asignación de unidades.
- [ ] **Dividir `src/frontend/components/auditoria/AuditorExecutiveView.astro` (916 lín - 🔴 Crítico)**: Extraer tarjetas de KPIs, gráficos de estado y tablas de logs a componentes hijos dedicados.
- [ ] **Dividir `src/pages/mi-viaje.astro` (800 lín - 🟡 Sobre umbral)**: Extraer los modales de carga de ticket, confirmación de inicio de viaje y resumen del trayecto a partials.
- [ ] **Dividir `src/frontend/scripts/miViajeController.ts` (770 lín - 🔴 Crítico)**: Modularizar la captura fotográfica con OCR, validación de odómetro y sincronización de estado del chofer.
- [ ] **Dividir `src/pages/viajes-choferes.astro` (718 lín - 🟡 Sobre umbral)**: Descomponer el layout de listas de viajes y filtros por estado en componentes específicos.
- [ ] **Dividir `src/frontend/components/flota/VehicleDetailModal.astro` (674 lín - 🟡 Sobre umbral)**: Separar cada una de las 4 pestañas técnicas (datos generales, historial comisiones, mantenimientos, consumo de combustible) en subcomponentes independientes.
- [ ] **Dividir `src/frontend/components/flota/VehicleFormModal.astro` (602 lín - 🟡 Sobre umbral)**: Extraer la validación de campos, selectores de dependencias y tipos de vehículo a partials de formulario.
- [ ] **Dividir `src/frontend/components/cronograma/CronogramaDispatchModal.astro` (580 lín - 🟡 Sobre umbral)**: Extraer selección de chofer sustituto y selector de móviles disponibles a componentes independientes.
- [ ] **Modularizar `src/frontend/scripts/combustibleController.ts` (428 lín - 🟡 Sobre umbral)**: Desacoplar la previsualización de imagen del ticket de combustible de las validaciones de carga.
- [ ] **Modularizar `src/frontend/scripts/viajesChoferesController.ts` (415 lín - 🟡 Sobre umbral)**: Extraer handlers de eventos de confirmación y paginación a utilidades específicas.
