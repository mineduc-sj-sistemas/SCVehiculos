# Documento Exclusivo de Mejoras y Evolución del Sistema
**SCVehiculos · Ministerio de Educación · Gobierno de San Juan**  
**Fecha:** 25 de Septiembre de 2026  
**Versión:** 2.1.0  
**Autor:** Equipo de Ingeniería de Software & Inteligencia Antigravity  

---

## 1. Resumen Ejecutivo

El presente documento detalla la totalidad de las mejoras de arquitectura, nuevas funcionalidades operativas, seguridad criptográfica y optimización de experiencia de usuario implementadas en el sistema **SCVehiculos** desde el inicio de la **Fase 1**, continuando por la **Fase 2** y consolidando la **Fase 3**.

El sistema administra integralmente el parque automotor, los conductores oficiales, las comisiones de servicio territorial, los talleres mecánicos y el abastecimiento de combustible de la Dirección de Movilidades del Ministerio de Educación de San Juan.

---

## 2. Cronología de Entregas y Fases

| Fase | Enfoque Principal | Estado | Commits / Hitos Clave |
| :--- | :--- | :---: | :--- |
| **Fase 1** | Hoja de Ruta Oficial A4 & Mantenimientos | ✅ Completada | [`a59867f`](https://github.com/mineduc-sj-sistemas/SCVehiculos/commit/a59867f) |
| **Fase 2** | Control de Costos de Combustible & Trazabilidad Visual | ✅ Completada | [`75181e2`](https://github.com/mineduc-sj-sistemas/SCVehiculos/commit/75181e2) |
| **Fase 3** | Reportes Excel/BOM, Alertas y Módulo de Viajes (`/viajes`) | ✅ Completada | [`0ea6ee0`](https://github.com/mineduc-sj-sistemas/SCVehiculos/commit/0ea6ee0) |

---

## 3. Detalle de Módulos Nuevos y Mejoras Operativas

### 3.1. Hoja de Ruta y Orden de Comisión Oficial para Impresión A4
- **Ubicación:** [`/cronograma/imprimir/[id]`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/pages/cronograma/imprimir/%5Bid%5D.astro)
- **Propósito:** Instrumento legal requerido por la Policía de San Juan y Gendarmería Nacional para la circulación de vehículos oficiales en rutas provinciales y nacionales.
- **Características técnicas:**
  - Diseño optimizado para hoja A4 vertical y estilos CSS `@media print` que eliminan barras de navegación, botones y fondos innecesarios.
  - **Membrete Institucional:** Escudo oficial del Gobierno de San Juan y Sol Incaico, con leyenda del Ministerio de Educación.
  - **Identificador Notarial:** Código único de comisión correlativo (ej. `COM-2026-0042`) y fecha de expedición.
  - **Sección I (Itinerario):** Origen, departamento de destino, horario estimado de salida y arribo, detalle de la misión y cupo de pasajeros.
  - **Sección II (Conductor):** Datos filiatorios (DNI, CUIL), carnet de conducir, categorías habilitadas (B1, D2, etc.) y vencimiento.
  - **Sección III (Vehículo):** Patente alfanumérica, marca, modelo, póliza de seguro oficial de Nación Seguros y fecha de vigencia de la RTO.
  - **Sección IV (Control de Kilometraje y Combustible):** Cuadro para asentar firma de salida/llegada con odómetro y novedades en ruta.
  - **Sección V (Bloque de 3 Firmas Formales):** Conductor Designado, Responsable de Despacho (Movilidades) y Autoridad Ministerial Solicitante.
  - **Acceso directo:** Botón "Imprimir Hoja de Ruta" disponible en la grilla y en el modal de detalle de comisiones.

---

### 3.2. Módulo de Mantenimiento y Servicios Mecánicos en Taller
- **Ubicación:** [`/mantenimientos`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/pages/mantenimientos.astro)
- **Propósito:** Registro centralizado de intervenciones mecánicas preventivas y correctivas, control de talleres y facturación.
- **Servicio Backend:** [`maintenanceService.ts`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/backend/services/maintenanceService.ts)
- **Funcionalidades:**
  - **Tarjetas KPI en Tiempo Real:** Total de servicios del mes, unidades actualmente en taller, gasto total acumulado en mano de obra y repuestos, y desglose de servicios preventivos vs. correctivos.
  - **Transición Atómica de Estado:** Al programar un service con ingreso inmediato, el vehículo conmuta atómicamente a `en_taller`, impidiendo que sea asignado a viajes simultáneos.
  - **Registro de Facturación y Liquidación:** Al finalizar el servicio, se ingresa el número de factura, costo de mano de obra, repuestos y observaciones, actualizando el odómetro y liberando el vehículo a `disponible`.
  - **Auditoría Automática:** Cada ingreso y egreso registra un evento inmutable en `auditoria_estados_vehiculo`.
  - **Filtros Reactivos:** Búsqueda en vivo por patente, taller o factura, y filtros combinados por estado y tipo de servicio.

---

### 3.3. Módulo de Cargas de Combustible y Rendimiento Kilométrico
- **Ubicación:** [`/combustible`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/pages/combustible.astro)
- **Propósito:** Fiscalización del consumo de combustibles líquidos y GNC, registro de tarjetas YPF en Ruta y cálculo de eficiencia.
- **Servicio Backend:** [`fuelService.ts`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/backend/services/fuelService.ts)
- **Algoritmo de Rendimiento Automático (Km/L):**
  - Cuando se asienta una carga con indicador `tanque_lleno = true`, el sistema busca la última carga previa a tanque lleno del mismo vehículo.
  - Calcula la distancia recorrida: $\Delta \text{km} = \text{odometro\_actual} - \text{odometro\_previo}$.
  - Computa el rendimiento exacto: $\text{Rendimiento} = \frac{\Delta \text{km}}{\text{litros\_cargados}}$.
  - Asienta el rendimiento en la base de datos y actualiza el odómetro oficial del vehículo.
- **Calculadora en Vivo en el Modal:**
  - Al ingresar los litros y el precio por litro, el formulario calcula instantáneamente el importe total sin recargar la página.
- **Soporte de Medios de Pago:**
  - Tarjeta Flota YPF en Ruta (con número de ticket/factura).
  - Orden Oficial de Carga.
  - Fondo Fijo / Caja Chica ministerial.

---

### 3.4. Línea de Tiempo de Auditoría en la Ficha 360° del Vehículo
- **Ubicación:** [`VehicleDetailModal.astro`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleDetailModal.astro) (Pestaña *Trazabilidad y Estados*)
- **Propósito:** Visibilidad total de cada cambio de estado operativo a lo largo de la vida útil del vehículo oficial.
- **Características:**
  - Consulta directa a la tabla `auditoria_estados_vehiculo` cruzada con `usuarios`.
  - Línea de tiempo visual con nodos de color según estado (`Disponible` en verde esmeralda, `En Comisión` en ámbar, `En Taller` en azul, `Baja` en rojo).
  - Flechas de transición: `Estado Anterior` $\rightarrow$ `Estado Nuevo`.
  - Motivo de la transición (ej. *"Salida a comisión COM-2026-0042"*, *"Ingreso a taller por service preventivo"*).
  - Identificación del usuario operador interviniente y fecha/hora exacta.

---

### 3.5. Sistema de Exportación de Reportes Oficiales en Excel (CSV UTF-8)
- **Propósito:** Descarga ágil de planillas para auditoría contable del Ministerio de Hacienda y de Educación.
- **Formato:** CSV delimitado por punto y coma (`;`), pre-pendeado con Byte Order Mark UTF-8 (`\uFEFF`) para que Microsoft Excel en español reconozca tildes, caracteres especiales y números formateados sin requerir configuración manual.
- **Reportes Disponibles:**
  1. **Reporte de Flota y Parque Automotor:** Patentes, marca, modelo, año, dependencia asignada, odómetro, vencimiento RTO, situación de Formulario 08 y estado operativo.
  2. **Reporte de Mantenimientos y Costos:** Fechas, talleres, tipo de trabajo, facturas, desglose de mano de obra y repuestos, y costo total.
  3. **Reporte de Combustible:** Cargas registradas, estaciones YPF/Shell, litros, precios, importes, tarjetas flota y rendimiento en Km/L.

---

### 3.6. Centro de Alertas y Monitor de Vencimientos Proactivos
- **Propósito:** Prevenir la circulación de unidades con RTO vencida, carnets de chofer caducos o services pasados de kilometraje.
- **Monitoreo Automático:**
  - **RTO / VTV:** Alerta amarilla si vence en menos de 30 días, alerta roja si ya expiró.
  - **Licencias de Conducir:** Verificación preventiva a 30 días del vencimiento del carnet del chofer.
  - **Formulario 08:** Seguimiento a transferencias de dominio ministerial pendientes de inscripción registral.
  - **Services Mecánicos:** Detección de turnos atrasados o pendientes de ingreso a taller.
- **Visualización:**
  - Campana interactiva en el Header con contador de alertas críticas.
  - Panel de avisos prioritarios en el inicio del panel de control.

---

### 3.7. Interfaz Dedicada de Viajes y Hojas de Ruta Oficiales
- **Ubicación:** [`/viajes`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/pages/viajes.astro)
- **Propósito:** Resolver la navegación inactiva del menú lateral (*"Viajes / Hojas de ruta"* apuntaba previamente a un ancla `#viajes`), centralizando la gestión de misiones de servicio, hojas de ruta y comisiones departamentales en una interfaz de alto rendimiento.
- **Servicio Backend:** [`viajesService.ts`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/backend/services/viajesService.ts)
- **Características:**
  - **Tarjetas KPI en Vivo:** Unidades en ruta activa, salidas programadas pendientes de despacho, kilómetros acumulados en el mes y total de viajes cerrados.
  - **Tabla Reactiva con Búsqueda Instantánea:** Filtrado en tiempo real por conductor, código de comisión, destino o patente, con selectores de estado (Todos, En Viaje, Programados, Finalizados, Cancelados).
  - **Acceso Directo a Hoja de Ruta A4:** Cada viaje posee un botón de impresión directa a la Hoja de Ruta Oficial con triple firma ministerial.
  - **Modales Integrados:** Despacho de nuevas comisiones y visualización de novedades de viaje con odómetros y trazabilidad.
  - **Exportación Excel Dedicada:** Endpoint [`/api/reportes/viajes`](file:///C:/Users/Docente/Desktop/SCVehiculos/src/pages/api/reportes/%5Btipo%5D.ts) para descarga instantánea de planillas CSV UTF-8 con BOM.

---

## 4. Arquitectura, Seguridad y Calidad del Software

### 4.1. Transaccionalidad ACID y Control Concurrente
- Todas las operaciones críticas de estado (salida de comisión, cierre de viaje, ingreso a taller, fin de mantenimiento) utilizan transacciones MySQL (`BEGIN ... COMMIT / ROLLBACK`) para garantizar que nunca queden registros huérfanos o estados inconsistentes.

### 4.2. Control de Acceso Basado en Roles (RBAC)
- **Rol 1 (Administrador):** Acceso total y exclusivo a gestión de usuarios, roles y auditoría.
- **Rol 2 (Operador / Despachador):** Creación y despacho de comisiones, flota y choferes.
- **Rol 3 (Mecánico / Taller):** Gestión de mantenimientos, órdenes de servicio y combustible.
- **Rol 4 (Chofer):** Consulta de comisiones asignadas y registro de combustible.

### 4.3. Criptografía y Sesiones
- Firmas HMAC-SHA256 con protección contra adulteración en tokens de sesión (`sc_session`).
- Contraseñas hasheadas de forma unidireccional con sal criptográfica segura.

---

## 5. Matriz del Plan de Pruebas Automatizadas (30/30 Casos Exitosos)

| ID | Módulo | Descripción del Caso de Prueba | Resultado |
| :---: | :--- | :--- | :---: |
| **TC-01** | Autenticación | Login con credenciales válidas y generación de cookie segura | ✅ PASSED |
| **TC-02** | Autenticación | Rechazo de login ante contraseña inválida (401) | ✅ PASSED |
| **TC-03** | Autenticación | Rechazo de login ante usuario inexistente (401) | ✅ PASSED |
| **TC-04** | Criptografía | Detección y rechazo de token HMAC adulterado (401) | ✅ PASSED |
| **TC-05** | Seguridad | Bloqueo de peticiones anónimas a endpoints mutativos (401) | ✅ PASSED |
| **TC-06** | RBAC | Bloqueo de rol Chofer en creación de vehículos (403) | ✅ PASSED |
| **TC-07** | RBAC | Bloqueo de rol Chofer en gestión de usuarios (403) | ✅ PASSED |
| **TC-08** | RBAC | Bloqueo de rol Operador en módulo de usuarios (403) | ✅ PASSED |
| **TC-09** | RBAC | Acceso autorizado de Administrador a lista de usuarios (200) | ✅ PASSED |
| **TC-10** | Flota | Obtención de lista completa de vehículos para Operador | ✅ PASSED |
| **TC-11** | Flota | Rechazo de alta de vehículo con datos faltantes (400) | ✅ PASSED |
| **TC-12** | Flota | Alta de nuevo vehículo oficial y persistencia en BD | ✅ PASSED |
| **TC-13** | Choferes | Consulta liviana de conductores sin base64 y con semáforos | ✅ PASSED |
| **TC-14** | Choferes | Carga integral de Ficha 360° individual de chofer | ✅ PASSED |
| **TC-15** | Choferes | Registro de licencia laboral y conmutación a estado "licencia" | ✅ PASSED |
| **TC-16** | Cronograma | Creación de comisión con código autogenerado correlativo | ✅ PASSED |
| **TC-17** | Cronograma | Despacho de salida: vehículo y chofer pasan a "en_comision" | ✅ PASSED |
| **TC-18** | Auditoría | Registro auditado de salida en `auditoria_estados_vehiculo` | ✅ PASSED |
| **TC-19** | Cronograma | Cierre de comisión con odómetro y restitución a "disponible" | ✅ PASSED |
| **TC-20** | Usuarios | Alta de credenciales para chofer y vinculación atómica en BD | ✅ PASSED |
| **TC-21** | Regla Negocio| Rechazo estricto de duplicación de usuario por chofer | ✅ PASSED |
| **TC-22** | Transacciones| Rollback ante fallas: cero registros huérfanos | ✅ PASSED |
| **TC-23** | Hoja de Ruta | Generación y renderizado de Hoja de Ruta oficial A4 | ✅ PASSED |
| **TC-24** | Mantenimiento| Registro de service e ingreso atómico a taller (`en_taller`) | ✅ PASSED |
| **TC-25** | Mantenimiento| Cierre de service, liquidación de costos y liberación | ✅ PASSED |
| **TC-26** | Combustible | Registro de carga, cálculo de Km/L y sincronización de odómetro| ✅ PASSED |
| **TC-27** | Trazabilidad | Línea de tiempo y trazabilidad de estados del vehículo | ✅ PASSED |
| **TC-28** | Reportes | Generación y exportación de planillas oficiales (CSV UTF-8) | ✅ PASSED |
| **TC-29** | Alertas | Evaluación de vencimientos de RTO, licencias y services | ✅ PASSED |
| **TC-30** | Viajes | Interfaz dedicada `/viajes` y exportación CSV con BOM | ✅ PASSED |

**Tasa de Efectividad:** **100% de Pruebas Aprobadas (30/30)**.
