# Sistema de Control de Movilidades y Flota Oficial (SCVehiculos)
### Ministerio de Educación · Gobierno de San Juan

Sistema web institucional para la gestión, control operativo y trazabilidad del parque automotor del Ministerio de Educación de la Provincia de San Juan.

---

## 🚀 Estado Actual del Desarrollo (Handover / Relevo)

El proyecto ha avanzado significativamente, eliminando todos los datos hardcodeados y conectando la aplicación a una base de datos MySQL relacional con soporte completo para codificación UTF-8.

### 1. Base de Datos Relacional (`sc_vehiculos`)
- **Archivos fuente**:
  - `database/schema.sql`: Estructura DDL completa de tablas e índices (`tipos_vehiculo`, `dependencias`, `choferes`, `vehiculos`, `mantenimientos`, `viajes`, `cargas_combustible`).
  - `database/seed.sql`: Datos maestros y registros oficiales del parque automotor (patentes, choferes, viajes a Jáchal/Calingasta/Valle Fértil, mantenimientos y cargas).
- **Campos incorporados**:
  - `patente`: Dominio del vehículo formateado.
  - `numero_cedula` y `fecha_vencimiento_cedula`: Documentación oficial de identificación.
  - `numero_rto` y `fecha_vencimiento_vtv`: Certificado y vencimiento de Revisión Técnica Obligatoria.
  - Póliza de seguro, odómetro, VIN/chasis, motor, tipo y capacidad de combustible.

### 2. Capa de Datos (`lib/db.ts`) y API REST
- Pool de conexiones `mysql2/promise` configurado con `charset: 'utf8mb4'`.
- Funciones SQL para KPIs, listado de flota, detalle 360° y guardado/edición de unidades.
- Endpoint `/api/vehiculos`:
  - `GET /api/vehiculos?id=X`: Devuelve vehículo + mantenimientos mecánicos + viajes + consumos de combustible.
  - `POST /api/vehiculos`: Da de alta o actualiza una movilidad en la base de datos.

### 3. Pantalla de Flota y Parque Automotor (`/flota`)
- **Ubicación**: `src/pages/flota.astro`.
- **Características**:
  - **KPIs en tiempo real**: Total flota, unidades disponibles, en comisión, en taller y alertas de RTO por vencer.
  - **Buscador reactivo**: Filtrado instantáneo por patente, modelo, marca o cédula oficial.
  - **Filtros por Estado, Tipo y Área Asignada**.
  - **Tabla de Flota**: Placas patentes con diseño oficial de chapa, semáforo visual de RTO, odómetro y dependencias.
  - **Ficha 360° (`VehicleDetailModal.astro`)**:
    - Pestaña 1: Ficha Técnica, Cédula oficial y estado de RTO / Seguro.
    - Pestaña 2: Historial Mecánico (servicios preventivos/correctivos, talleres y costos).
    - Pestaña 3: Historial de Viajes y Comisiones (destinos, fechas, chóferes y km recorridos).
    - Pestaña 4: Control de Consumo de Combustible y rendimiento.
  - **Formulario de Registro / Edición (`VehicleFormModal.astro`)**: Modal validado para crear nuevas unidades o editar móviles existentes.

### 4. Layout Base Institucional (`src/layouts/DashboardLayout.astro`)
- Envelope HTML5 estandarizado con `<meta charset="UTF-8">` (elimina cualquier error de caracteres `Ã³`, `Ã`, etc.).
- Navegación lateral con slugs limpios (`/`, `/flota`, `/choferes`, `/viajes`, `/mantenimientos`, `/combustible`).
- Header superior con fecha oficial en español y usuario autenticado.

---

## 🛠️ Requisitos e Instalación Local

1. **MySQL en Laragon**:
   - Iniciar MySQL en Laragon (puerto 3306 por defecto).
   - Crear la base de datos `sc_vehiculos`.
   - Ejecutar los scripts:
     ```bash
     mysql -u root sc_vehiculos < database/schema.sql
     mysql -u root sc_vehiculos < database/seed.sql
     ```
2. **Variables de Entorno**:
   - Copiar `.env.example` a `.env` y configurar credenciales si difieren del estándar local.
3. **Instalación de Dependencias**:
   ```bash
   pnpm install
   ```
4. **Levantar Servidor de Desarrollo**:
   > **Nota para agentes o PowerShell**: Astro 7 puede desacoplar procesos en segundo plano. Para correrlo de forma persistente en terminal ejecutar:
   ```powershell
   $env:ASTRO_DEV_BACKGROUND="false"; pnpm astro dev
   ```
   Abrir: `http://localhost:4321/` o `http://localhost:4321/flota`.

---

## 📌 Próximos Módulos Sugeridos para Continuar

1. **Módulo de Choferes (`/choferes`)**:
   - Vista de personal de choferes, licencias de conducir con semáforo de vencimiento, teléfonos de contacto y asignación de viajes.
2. **Módulo de Viajes y Hojas de Ruta (`/viajes`)**:
   - Registro de comisiones oficiales, chofer asignado, movilidad, odómetro de salida y llegada, estado del viaje.
3. **Módulo de Mantenimientos (`/mantenimientos`)**:
   - Órdenes de taller, presupuesto, fechas de ingreso y egreso, tipo de servicio (preventivo/correctivo).
4. **Módulo de Combustible (`/combustible`)**:
   - Registro de vales y tickets de carga, litros cargados, cálculo de rendimiento (km/L) e importe total.
