# Sistema de Control de Movilidades y Flota Oficial (SCVehiculos)
### Ministerio de Educación · Gobierno de San Juan

Sistema web institucional para la gestión, control operativo y trazabilidad del parque automotor del Ministerio de Educación de la Provincia de San Juan.

---

## 🏛️ Arquitectura del Proyecto: Separación Frontend y Backend

El código está estructurado con una separación limpia y modular entre la capa de **Frontend** (diseño, componentes visuales, estilos y UX) y la capa de **Backend** (conexión a base de datos MySQL, modelos TypeScript, servicios de dominio y endpoints de API).

```
SCVehiculos/
├── database/                               # Scripts SQL de MySQL
│   ├── schema.sql                          # Estructura DDL completa de tablas e índices
│   └── seed.sql                            # Datos maestros y parque automotor oficial
│
├── src/
│   ├── backend/                            # 🔧 CAPA BACKEND (Datos, Lógica y Modelos)
│   │   ├── config/
│   │   │   └── db.ts                       # Conexión MySQL con pool utf8mb4 y query helper
│   │   ├── types/                          # Contratos y tipos TypeScript
│   │   │   ├── vehicle.types.ts            # Tipos de vehículos, fichas 360 y formularios
│   │   │   ├── dashboard.types.ts          # Tipos de KPIs y resumen operativo
│   │   │   └── index.ts                    # Exportador unificado de tipos
│   │   ├── services/                       # Servicios de consultas y lógica de negocio
│   │   │   ├── vehicleService.ts           # CRUD vehículos, tipos, dependencias, ficha 360
│   │   │   └── dashboardService.ts         # KPIs, comisiones, mantenimientos, choferes y combustible
│   │   └── index.ts                        # Punto de exportación unificado del backend
│   │
│   ├── frontend/                           # 🎨 CAPA FRONTEND (UI, Estilos y Componentes)
│   │   ├── components/                     # Componentes visuales organizados por dominio
│   │   │   ├── layout/                     # Elementos estructurales
│   │   │   │   ├── Sidebar.astro           # Menú lateral con accesos y estado activo
│   │   │   │   ├── Header.astro            # Cabecera superior con fecha oficial y buscador
│   │   │   │   └── Footer.astro            # Pie de página institucional y estado de conexión
│   │   │   ├── flota/                      # Gestión de parque automotor
│   │   │   │   ├── VehicleKpiCards.astro   # Tarjetas métricas superiores de unidades
│   │   │   │   ├── VehicleFilters.astro    # Buscador y selectores de filtrado
│   │   │   │   ├── VehicleTable.astro      # Tabla de unidades con semáforos y acciones
│   │   │   │   ├── VehicleDetailModal.astro # Ficha técnica 360° con 4 pestañas interactivas
│   │   │   │   └── VehicleFormModal.astro   # Modal de creación y edición validado
│   │   │   ├── dashboard/                  # Panel principal
│   │   │   │   └── DashboardStatCards.astro # Tarjetas de métricas del panel
│   │   │   └── ui/                         # Componentes atómicos reutilizables
│   │   │       ├── StatusBadge.astro       # Semáforos de estado (disponible, comisión, taller)
│   │   │       └── PlateBadge.astro        # Chapa patente argentina oficial
│   │   ├── layouts/
│   │   │   └── DashboardLayout.astro       # Layout maestro que integra Sidebar, Header y Footer
│   │   ├── styles/
│   │   │   └── global.css                  # Variables CSS, fuentes institucionales y Tailwind
│   │   ├── scripts/                        # Interactividad del lado del cliente
│   │   │   └── flotaController.ts          # Controlador de búsqueda reactiva y modales
│   │   └── index.ts                        # Barrel export del Frontend
│   │
│   ├── pages/                              # 🌐 CONTROLADORES DE RUTA (Astro Routing)
│   │   ├── index.astro                     # Página principal / (Dashboard)
│   │   ├── flota.astro                     # Página /flota (Parque Automotor)
│   │   └── api/                            # Endpoints REST HTTP
│   │       └── vehiculos/
│   │           └── index.ts                # Endpoint API /api/vehiculos (GET, POST)
│   │
│   ├── middleware.ts                       # Middleware de codificación UTF-8
│   └── env.d.ts                            # Declaraciones de tipos para Astro
│
├── lib/
│   ├── db.ts                               # Fachada retrocompatible hacia src/backend
│   └── utils.ts                            # Helper cn() para clases de Tailwind
│
└── tsconfig.json                           # Configuración de TypeScript con alias @backend y @frontend
```

---

## 🚀 Guía Rápida para Desarrolladores

### ¿Dónde implementar cambios visuales o de interfaz (Frontend)?
- **Modificar la navegación o cabecera**: [Sidebar.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/layout/Sidebar.astro) o [Header.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/layout/Header.astro).
- **Modificar colores, tipografía o utilidades CSS**: [global.css](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/styles/global.css).
- **Modificar la vista de la flota o sus tarjetas**: [VehicleKpiCards.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleKpiCards.astro), [VehicleFilters.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleFilters.astro) o [VehicleTable.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleTable.astro).
- **Modificar modales de detalle o edición**: [VehicleDetailModal.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleDetailModal.astro) o [VehicleFormModal.astro](file:///c:/Users/Docente/Desktop/SCVehiculos/src/frontend/components/flota/VehicleFormModal.astro).

### ¿Dónde implementar cambios de datos, SQL o endpoints (Backend)?
- **Conexión o credenciales a MySQL**: [db.ts](file:///c:/Users/Docente/Desktop/SCVehiculos/src/backend/config/db.ts).
- **Consultas SQL de vehículos y parque automotor**: [vehicleService.ts](file:///c:/Users/Docente/Desktop/SCVehiculos/src/backend/services/vehicleService.ts).
- **Consultas SQL de estadísticas y panel**: [dashboardService.ts](file:///c:/Users/Docente/Desktop/SCVehiculos/src/backend/services/dashboardService.ts).
- **Nuevos endpoints REST**: [src/pages/api/](file:///c:/Users/Docente/Desktop/SCVehiculos/src/pages/api).

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
   ```powershell
   $env:ASTRO_DEV_BACKGROUND="false"; pnpm astro dev
   ```
   Abrir en navegador: `http://localhost:4321/` o `http://localhost:4321/flota`.

---

## 📌 Próximos Módulos Planificados

1. **Módulo de Choferes (`/choferes`)**:
   - Vista de personal de choferes, licencias de conducir con semáforo de vencimiento y teléfonos de contacto.
2. **Módulo de Viajes y Hojas de Ruta (`/viajes`)**:
   - Registro de comisiones oficiales, chofer asignado, movilidad, odómetro de salida y llegada.
3. **Módulo de Mantenimientos (`/mantenimientos`)**:
   - Órdenes de taller, presupuesto, fechas de ingreso y egreso, tipo de servicio (preventivo/correctivo).
4. **Módulo de Combustible (`/combustible`)**:
   - Registro de vales y tickets de carga, litros cargados, cálculo de rendimiento (km/L) e importe total.
