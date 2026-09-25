import { query, withTransaction } from '../config/db'

export type TipoMantenimiento = 'preventivo' | 'correctivo' | 'inspeccion'
export type EstadoMantenimiento = 'programado' | 'en_curso' | 'completado' | 'cancelado'

export interface MantenimientoItem {
  id: number
  vehiculoId: number
  vehiculoPatente: string
  vehiculoMarca: string
  vehiculoModelo: string
  tipo: TipoMantenimiento
  titulo: string
  descripcion: string | null
  tallerProveedor: string | null
  odometroServicio: number
  fechaProgramada: string
  fechaIngreso: string | null
  fechaEgreso: string | null
  costoManoObra: number
  costoRepuestos: number
  costoTotal: number
  numeroFactura: string | null
  estado: EstadoMantenimiento
  detalleTrabajos: string | null
  proximoMantenimientoKm: number | null
  proximoMantenimientoFecha: string | null
  usuarioRegistroNombre: string | null
  createdAt: string
}

export interface MaintenanceKpis {
  totalMes: number
  enTallerAhora: number
  gastoTotalMes: number
  preventivosCount: number
  correctivosCount: number
}

export interface NuevoMantenimientoDTO {
  vehiculoId: number
  tipo: TipoMantenimiento
  titulo: string
  descripcion?: string
  tallerProveedor?: string
  odometroServicio: number
  fechaProgramada: string
  ingresarATaller?: boolean
  costoManoObra?: number
  costoRepuestos?: number
  numeroFactura?: string
  usuarioId?: number
}

export interface FinalizarMantenimientoDTO {
  odometroServicio?: number
  costoManoObra?: number
  costoRepuestos?: number
  numeroFactura?: string
  detalleTrabajos?: string
  proximoMantenimientoKm?: number
  proximoMantenimientoFecha?: string
  usuarioId?: number
}

function formatDate(d: any): string | null {
  if (!d) return null
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(d).split('T')[0]
}

/**
 * Obtiene métricas ejecutivas de mantenimiento para el mes en curso
 */
export async function getMaintenanceKpis(): Promise<MaintenanceKpis> {
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  const fechaInicioMes = formatDate(currentMonthStart)

  const [resTotales, resEnTaller, resGastos] = await Promise.all([
    query<any>(
      `SELECT 
        COUNT(*) AS total_mes,
        SUM(CASE WHEN tipo = 'preventivo' THEN 1 ELSE 0 END) AS preventivos,
        SUM(CASE WHEN tipo = 'correctivo' THEN 1 ELSE 0 END) AS correctivos
       FROM mantenimientos
       WHERE fecha_programada >= ?`,
      [fechaInicioMes]
    ),
    query<any>(
      `SELECT COUNT(*) AS en_taller FROM vehiculos WHERE estado = 'en_taller' AND activo = 1`
    ),
    query<any>(
      `SELECT COALESCE(SUM(costo_total), 0) AS gasto_mes 
       FROM mantenimientos 
       WHERE (fecha_egreso >= ? OR (fecha_egreso IS NULL AND fecha_programada >= ?)) 
         AND estado != 'cancelado'`,
      [fechaInicioMes, fechaInicioMes]
    ),
  ])

  const t = resTotales[0] || {}
  const et = resEnTaller[0] || {}
  const g = resGastos[0] || {}

  return {
    totalMes: Number(t.total_mes ?? 0),
    enTallerAhora: Number(et.en_taller ?? 0),
    gastoTotalMes: Number(g.gasto_mes ?? 0),
    preventivosCount: Number(t.preventivos ?? 0),
    correctivosCount: Number(t.correctivos ?? 0),
  }
}

/**
 * Obtiene el listado completo de mantenimientos ordenados cronológicamente
 */
export async function getMaintenanceList(tipo?: string, estado?: string): Promise<MantenimientoItem[]> {
  let sql = `
    SELECT 
      m.id, m.vehiculo_id, m.tipo, m.titulo, m.descripcion, m.taller_proveedor,
      m.odometro_servicio, m.fecha_programada, m.fecha_ingreso, m.fecha_egreso,
      m.costo_mano_obra, m.costo_repuestos, m.costo_total, m.numero_factura,
      m.estado, m.detalle_trabajos, m.proximo_mantenimiento_km, m.proximo_mantenimiento_fecha,
      m.created_at,
      v.patente AS vehiculo_patente, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
      CONCAT(u.nombre, ' ', u.apellido) AS usuario_registro_nombre
    FROM mantenimientos m
    INNER JOIN vehiculos v ON m.vehiculo_id = v.id
    LEFT JOIN usuarios u ON m.usuario_registro_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (tipo) {
    sql += ` AND m.tipo = ?`
    params.push(tipo)
  }
  if (estado) {
    sql += ` AND m.estado = ?`
    params.push(estado)
  }

  sql += ` ORDER BY m.fecha_programada DESC, m.id DESC`

  const rows = await query<any>(sql, params)

  return rows.map((r: any) => ({
    id: Number(r.id),
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoMarca: r.vehiculo_marca,
    vehiculoModelo: r.vehiculo_modelo,
    tipo: r.tipo as TipoMantenimiento,
    titulo: r.titulo,
    descripcion: r.descripcion ?? null,
    tallerProveedor: r.taller_proveedor ?? null,
    odometroServicio: Number(r.odometro_servicio ?? 0),
    fechaProgramada: formatDate(r.fecha_programada) || '',
    fechaIngreso: r.fecha_ingreso ? (r.fecha_ingreso instanceof Date ? r.fecha_ingreso.toISOString() : String(r.fecha_ingreso)) : null,
    fechaEgreso: r.fecha_egreso ? (r.fecha_egreso instanceof Date ? r.fecha_egreso.toISOString() : String(r.fecha_egreso)) : null,
    costoManoObra: Number(r.costo_mano_obra ?? 0),
    costoRepuestos: Number(r.costo_repuestos ?? 0),
    costoTotal: Number(r.costo_total ?? 0),
    numeroFactura: r.numero_factura ?? null,
    estado: r.estado as EstadoMantenimiento,
    detalleTrabajos: r.detalle_trabajos ?? null,
    proximoMantenimientoKm: r.proximo_mantenimiento_km ? Number(r.proximo_mantenimiento_km) : null,
    proximoMantenimientoFecha: formatDate(r.proximo_mantenimiento_fecha),
    usuarioRegistroNombre: r.usuario_registro_nombre ?? 'Administración',
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }))
}

/**
 * Registra un nuevo servicio de mantenimiento y transiciona el vehículo si ingresa de inmediato
 */
export async function createMaintenance(dto: NuevoMantenimientoDTO): Promise<{ id: number; success: boolean }> {
  return withTransaction(async (conn) => {
    // 1. Obtener estado actual del vehículo
    const [vehRows] = await conn.execute<any>(
      `SELECT id, estado, odometro_actual FROM vehiculos WHERE id = ? FOR UPDATE`,
      [dto.vehiculoId]
    )

    if (!vehRows || vehRows.length === 0) {
      throw new Error(`El vehículo especificado con ID ${dto.vehiculoId} no existe.`)
    }

    const vehiculo = vehRows[0]
    const estadoAnterior = vehiculo.estado
    const estadoInicial: EstadoMantenimiento = dto.ingresarATaller ? 'en_curso' : 'programado'

    // 2. Insertar registro de mantenimiento
    const [resInsert] = await conn.execute<any>(
      `INSERT INTO mantenimientos (
        vehiculo_id, tipo, titulo, descripcion, taller_proveedor,
        odometro_servicio, fecha_programada, fecha_ingreso,
        costo_mano_obra, costo_repuestos, numero_factura,
        estado, usuario_registro_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.vehiculoId,
        dto.tipo,
        dto.titulo,
        dto.descripcion ?? null,
        dto.tallerProveedor ?? null,
        dto.odometroServicio,
        dto.fechaProgramada,
        dto.ingresarATaller ? new Date() : null,
        dto.costoManoObra ?? 0,
        dto.costoRepuestos ?? 0,
        dto.numeroFactura ?? null,
        estadoInicial,
        dto.usuarioId ?? null,
      ]
    )

    const nuevoId = resInsert.insertId

    // 3. Si ingresa a taller de inmediato, actualizar vehículo a 'en_taller'
    if (dto.ingresarATaller && estadoAnterior !== 'en_taller') {
      await conn.execute(
        `UPDATE vehiculos SET estado = 'en_taller' WHERE id = ?`,
        [dto.vehiculoId]
      )

      // Registrar auditoría del cambio de estado
      await conn.execute(
        `INSERT INTO auditoria_estados_vehiculo (
          vehiculo_id, estado_anterior, estado_nuevo, motivo, mantenimiento_id, usuario_id, created_at
        ) VALUES (?, ?, 'en_taller', ?, ?, ?, NOW())`,
        [
          dto.vehiculoId,
          estadoAnterior,
          `Ingreso a servicio mecánico: ${dto.titulo}`,
          nuevoId,
          dto.usuarioId ?? null,
        ]
      )
    }

    return { id: nuevoId, success: true }
  })
}

/**
 * Finaliza un servicio de mantenimiento, computa costos finales y restituye el vehículo a 'disponible'
 */
export async function completeMaintenance(id: number, dto: FinalizarMantenimientoDTO): Promise<{ success: boolean }> {
  return withTransaction(async (conn) => {
    // 1. Obtener datos del mantenimiento
    const [mantenimientoRows] = await conn.execute<any>(
      `SELECT m.id, m.vehiculo_id, m.estado, m.titulo, v.estado AS estado_vehiculo, v.odometro_actual
       FROM mantenimientos m
       INNER JOIN vehiculos v ON m.vehiculo_id = v.id
       WHERE m.id = ? FOR UPDATE`,
      [id]
    )

    if (!mantenimientoRows || mantenimientoRows.length === 0) {
      throw new Error(`El mantenimiento #${id} no existe.`)
    }

    const mant = mantenimientoRows[0]
    const vehiculoId = mant.vehiculo_id
    const estadoAnteriorVehiculo = mant.estado_vehiculo

    // 2. Actualizar registro a completado con fecha de egreso
    await conn.execute(
      `UPDATE mantenimientos SET 
        estado = 'completado',
        fecha_egreso = NOW(),
        costo_mano_obra = COALESCE(?, costo_mano_obra),
        costo_repuestos = COALESCE(?, costo_repuestos),
        numero_factura = COALESCE(?, numero_factura),
        detalle_trabajos = COALESCE(?, detalle_trabajos),
        proximo_mantenimiento_km = COALESCE(?, proximo_mantenimiento_km),
        proximo_mantenimiento_fecha = COALESCE(?, proximo_mantenimiento_fecha)
       WHERE id = ?`,
      [
        dto.costoManoObra ?? null,
        dto.costoRepuestos ?? null,
        dto.numeroFactura ?? null,
        dto.detalleTrabajos ?? null,
        dto.proximoMantenimientoKm ?? null,
        dto.proximoMantenimientoFecha ?? null,
        id,
      ]
    )

    // 3. Restituir vehículo a 'disponible' y actualizar odómetro si aplica
    const nuevoOdometro = dto.odometroServicio && dto.odometroServicio > mant.odometro_actual 
      ? dto.odometroServicio 
      : mant.odometro_actual

    await conn.execute(
      `UPDATE vehiculos SET 
        estado = 'disponible',
        odometro_actual = ?
       WHERE id = ?`,
      [nuevoOdometro, vehiculoId]
    )

    // 4. Registrar auditoría de restitución a disponible
    await conn.execute(
      `INSERT INTO auditoria_estados_vehiculo (
        vehiculo_id, estado_anterior, estado_nuevo, motivo, mantenimiento_id, usuario_id, created_at
      ) VALUES (?, ?, 'disponible', 'Egreso de taller y mantenimiento completado', ?, ?, NOW())`,
      [
        vehiculoId,
        estadoAnteriorVehiculo,
        id,
        dto.usuarioId ?? null,
      ]
    )

    return { success: true }
  })
}

/**
 * Cancela un mantenimiento programado
 */
export async function cancelMaintenance(id: number, usuarioId?: number): Promise<{ success: boolean }> {
  return withTransaction(async (conn) => {
    const [rows] = await conn.execute<any>(
      `SELECT m.id, m.vehiculo_id, m.estado, v.estado AS estado_vehiculo
       FROM mantenimientos m
       INNER JOIN vehiculos v ON m.vehiculo_id = v.id
       WHERE m.id = ? FOR UPDATE`,
      [id]
    )

    if (!rows || rows.length === 0) throw new Error('Mantenimiento no encontrado')
    const m = rows[0]

    await conn.execute(`UPDATE mantenimientos SET estado = 'cancelado' WHERE id = ?`, [id])

    // Si el vehículo estaba retenido en taller, liberarlo a disponible
    if (m.estado_vehiculo === 'en_taller') {
      await conn.execute(`UPDATE vehiculos SET estado = 'disponible' WHERE id = ?`, [m.vehiculo_id])
      await conn.execute(
        `INSERT INTO auditoria_estados_vehiculo (
          vehiculo_id, estado_anterior, estado_nuevo, motivo, mantenimiento_id, usuario_id, created_at
        ) VALUES (?, 'en_taller', 'disponible', 'Mantenimiento cancelado', ?, ?, NOW())`,
        [m.vehiculo_id, id, usuarioId ?? null]
      )
    }

    return { success: true }
  })
}
