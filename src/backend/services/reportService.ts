/**
 * Servicio de Exportación de Reportes Oficiales en Formato Excel (CSV con UTF-8 BOM)
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { getVehiclesFullList } from './vehicleService'
import { getMaintenanceList } from './maintenanceService'
import { getFuelList } from './fuelService'

/**
 * Helper para escapar valores en CSV (delimitador punto y coma para Excel en español)
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val).trim()
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/**
 * 1. Reporte de Flota y Parque Automotor Oficial
 */
export async function generateFleetCsv(): Promise<string> {
  const vehicles = await getVehiclesFullList()
  const headers = [
    'Patente',
    'Marca',
    'Modelo',
    'Versión',
    'Año',
    'Tipo de Vehículo',
    'Dependencia Asignada',
    'Odómetro Actual (Km)',
    'Combustible',
    'Capacidad Tanque (L)',
    'Capacidad Pasajeros',
    'Vencimiento RTO',
    'Estado RTO',
    'Días Restantes RTO',
    'Formulario 08',
    'Vencimiento 08',
    'Compañía Seguro',
    'Póliza Seguro',
    'Estado Operativo',
  ]

  const rows = vehicles.map((v) => [
    escapeCsv(v.patente),
    escapeCsv(v.marca),
    escapeCsv(v.modelo),
    escapeCsv(v.version || ''),
    escapeCsv(v.anio || ''),
    escapeCsv(v.tipoNombre),
    escapeCsv(v.dependenciaNombre),
    escapeCsv(v.odometroActual),
    escapeCsv(v.tipoCombustibleLabel),
    escapeCsv(v.capacidadTanqueLitros || ''),
    escapeCsv(v.capacidadPasajeros),
    escapeCsv(v.vtvFormatted),
    escapeCsv(v.vtvStatus === 'vigente' ? 'Vigente' : v.vtvStatus === 'proxima' ? 'Próxima a vencer' : 'Vencida'),
    escapeCsv(v.vtvDaysRemaining),
    escapeCsv(v.estado08Label),
    escapeCsv(v.vencimiento08Formatted || 'No aplica'),
    escapeCsv(v.companiaSeguro || ''),
    escapeCsv(v.numeroPoliza || ''),
    escapeCsv(v.estadoLabel),
  ])

  // \uFEFF es el BOM (Byte Order Mark) que fuerza a Excel a abrir el archivo en UTF-8 nativo
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  return csvContent
}

/**
 * 2. Reporte de Mantenimiento y Costos de Taller Mecánico
 */
export async function generateMaintenanceCsv(): Promise<string> {
  const mantenimientos = await getMaintenanceList()
  const headers = [
    'ID',
    'Fecha Programada',
    'Fecha Ingreso',
    'Fecha Egreso',
    'Patente',
    'Vehículo',
    'Tipo de Servicio',
    'Título / Motivo',
    'Taller Proveedor',
    'Odómetro Servicio (Km)',
    'N° Factura',
    'Costo Mano de Obra ($)',
    'Costo Repuestos ($)',
    'Costo Total ($)',
    'Próximo Service (Km)',
    'Estado',
    'Detalle de Trabajos',
  ]

  const rows = mantenimientos.map((m) => [
    escapeCsv(m.id),
    escapeCsv(m.fechaProgramada),
    escapeCsv(m.fechaIngreso || ''),
    escapeCsv(m.fechaEgreso || ''),
    escapeCsv(m.vehiculoPatente),
    escapeCsv(`${m.vehiculoMarca} ${m.vehiculoModelo}`),
    escapeCsv(m.tipo === 'preventivo' ? 'Preventivo' : m.tipo === 'correctivo' ? 'Correctivo' : 'Inspección'),
    escapeCsv(m.titulo),
    escapeCsv(m.tallerProveedor || 'Taller Central'),
    escapeCsv(m.odometroServicio),
    escapeCsv(m.numeroFactura || ''),
    escapeCsv(m.costoManoObra),
    escapeCsv(m.costoRepuestos),
    escapeCsv(m.costoTotal),
    escapeCsv(m.proximoMantenimientoKm || ''),
    escapeCsv(
      m.estado === 'programado'
        ? 'Programado'
        : m.estado === 'en_curso'
        ? 'En Taller'
        : m.estado === 'completado'
        ? 'Completado'
        : 'Cancelado'
    ),
    escapeCsv(m.detalleTrabajos || ''),
  ])

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  return csvContent
}

/**
 * 3. Reporte de Consumo de Combustible y Rendimiento
 */
export async function generateFuelCsv(): Promise<string> {
  const cargas = await getFuelList()
  const headers = [
    'ID',
    'Fecha y Hora',
    'Patente',
    'Vehículo',
    'Conductor Responsable',
    'Estación de Servicio',
    'Tipo de Combustible',
    'Litros Cargados',
    'Precio por Litro ($)',
    'Importe Total ($)',
    'Odómetro Carga (Km)',
    'Tanque Lleno',
    'N° Ticket / Factura',
    'Método de Pago',
    'Rendimiento (Km/L)',
    'Observaciones',
  ]

  const rows = cargas.map((c) => [
    escapeCsv(c.id),
    escapeCsv(c.fechaCarga),
    escapeCsv(c.vehiculoPatente),
    escapeCsv(`${c.vehiculoMarca} ${c.vehiculoModelo}`),
    escapeCsv(c.choferNombreCompleto || 'No asignado'),
    escapeCsv(c.estacionServicio || 'No informada'),
    escapeCsv(c.tipoCombustible),
    escapeCsv(c.litros),
    escapeCsv(c.precioPorLitro),
    escapeCsv(c.importeTotal),
    escapeCsv(c.odometroCarga),
    escapeCsv(c.tanqueLleno ? 'Sí' : 'No'),
    escapeCsv(c.numeroTicket || ''),
    escapeCsv(
      c.metodoPago === 'tarjeta_flota'
        ? 'Tarjeta Flota YPF en Ruta'
        : c.metodoPago === 'orden_oficial'
        ? 'Orden de Carga Oficial'
        : 'Fondo Fijo / Caja Chica'
    ),
    escapeCsv(c.rendimientoKmL !== null ? c.rendimientoKmL.toFixed(2) : 'Sin calcular'),
    escapeCsv(c.observaciones || ''),
  ])

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n')
  return csvContent
}
