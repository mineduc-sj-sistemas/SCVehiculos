import { query, withTransaction } from '../config/db'

export type TipoCombustible = 'nafta_super' | 'nafta_premium' | 'diesel_500' | 'diesel_grado_3' | 'gnc'
export type MetodoPagoCombustible = 'tarjeta_flota' | 'orden_oficial' | 'efectivo_fondo_fijo'

export interface CargaCombustibleItem {
  id: number
  vehiculoId: number
  vehiculoPatente: string
  vehiculoMarca: string
  vehiculoModelo: string
  choferId: number | null
  choferNombreCompleto: string | null
  comisionId: number | null
  codigoComision: string | null
  fechaCarga: string
  estacionServicio: string | null
  tipoCombustible: TipoCombustible
  litros: number
  precioPorLitro: number
  importeTotal: number
  odometroCarga: number
  tanqueLleno: boolean
  numeroTicket: string | null
  metodoPago: MetodoPagoCombustible
  rendimientoKmL: number | null
  observaciones: string | null
  usuarioRegistroNombre: string | null
  createdAt: string
}

export interface FuelKpis {
  totalLitrosMes: number
  gastoTotalMes: number
  cargasCountMes: number
  rendimientoPromedioKmL: number
}

export interface NuevaCargaCombustibleDTO {
  vehiculoId: number
  choferId?: number
  comisionId?: number
  fechaCarga: string
  estacionServicio?: string
  tipoCombustible: TipoCombustible
  litros: number
  precioPorLitro: number
  importeTotal?: number
  odometroCarga: number
  tanqueLleno?: boolean
  numeroTicket?: string
  metodoPago?: MetodoPagoCombustible
  observaciones?: string
  usuarioId?: number
}

function formatDate(d: any): string {
  if (!d) return ''
  if (d instanceof Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  return String(d).split('T')[0]
}

/**
 * Obtiene métricas ejecutivas de combustible para el mes en curso
 */
export async function getFuelKpis(): Promise<FuelKpis> {
  const currentMonthStart = new Date()
  currentMonthStart.setDate(1)
  const fechaInicioMes = formatDate(currentMonthStart)

  const [resTotales, resRendimiento] = await Promise.all([
    query<any>(
      `SELECT 
        COUNT(*) AS total_cargas,
        COALESCE(SUM(litros), 0) AS total_litros,
        COALESCE(SUM(importe_total), 0) AS total_importe
       FROM cargas_combustible
       WHERE fecha_carga >= ?`,
      [fechaInicioMes]
    ),
    query<any>(
      `SELECT AVG(rendimiento_km_l) AS rend_promedio 
       FROM cargas_combustible 
       WHERE rendimiento_km_l IS NOT NULL AND rendimiento_km_l > 0`
    ),
  ])

  const t = resTotales[0] || {}
  const r = resRendimiento[0] || {}

  return {
    totalLitrosMes: Number(Number(t.total_litros ?? 0).toFixed(1)),
    gastoTotalMes: Number(t.total_importe ?? 0),
    cargasCountMes: Number(t.total_cargas ?? 0),
    rendimientoPromedioKmL: Number(Number(r.rend_promedio ?? 10.5).toFixed(2)),
  }
}

/**
 * Obtiene el listado completo de cargas de combustible con filtros opcionales
 */
export async function getFuelList(vehiculoId?: number, choferId?: number): Promise<CargaCombustibleItem[]> {
  let sql = `
    SELECT 
      c.id, c.vehiculo_id, c.chofer_id, c.comision_id, c.fecha_carga,
      c.estacion_servicio, c.tipo_combustible, c.litros, c.precio_por_litro,
      c.importe_total, c.odometro_carga, c.tanque_lleno, c.numero_ticket,
      c.metodo_pago, c.rendimiento_km_l, c.observaciones, c.created_at,
      v.patente AS vehiculo_patente, v.marca AS vehiculo_marca, v.modelo AS vehiculo_modelo,
      CONCAT(ch.apellido, ', ', ch.nombre) AS chofer_nombre_completo,
      com.codigo_comision,
      CONCAT(u.nombre, ' ', u.apellido) AS usuario_registro_nombre
    FROM cargas_combustible c
    INNER JOIN vehiculos v ON c.vehiculo_id = v.id
    LEFT JOIN choferes ch ON c.chofer_id = ch.id
    LEFT JOIN comisiones com ON c.comision_id = com.id
    LEFT JOIN usuarios u ON c.usuario_registro_id = u.id
    WHERE 1=1
  `
  const params: any[] = []

  if (vehiculoId) {
    sql += ` AND c.vehiculo_id = ?`
    params.push(vehiculoId)
  }
  if (choferId) {
    sql += ` AND c.chofer_id = ?`
    params.push(choferId)
  }

  sql += ` ORDER BY c.fecha_carga DESC, c.id DESC`

  const rows = await query<any>(sql, params)

  return rows.map((r: any) => ({
    id: Number(r.id),
    vehiculoId: Number(r.vehiculo_id),
    vehiculoPatente: r.vehiculo_patente,
    vehiculoMarca: r.vehiculo_marca,
    vehiculoModelo: r.vehiculo_modelo,
    choferId: r.chofer_id ? Number(r.chofer_id) : null,
    choferNombreCompleto: r.chofer_nombre_completo ?? null,
    comisionId: r.comision_id ? Number(r.comision_id) : null,
    codigoComision: r.codigo_comision ?? null,
    fechaCarga: r.fecha_carga instanceof Date ? r.fecha_carga.toISOString() : String(r.fecha_carga),
    estacionServicio: r.estacion_servicio ?? null,
    tipoCombustible: r.tipo_combustible as TipoCombustible,
    litros: Number(r.litros),
    precioPorLitro: Number(r.precio_por_litro),
    importeTotal: Number(r.importe_total),
    odometroCarga: Number(r.odometro_carga),
    tanqueLleno: Boolean(r.tanque_lleno),
    numeroTicket: r.numero_ticket ?? null,
    metodoPago: r.metodo_pago as MetodoPagoCombustible,
    rendimientoKmL: r.rendimiento_km_l ? Number(r.rendimiento_km_l) : null,
    observaciones: r.observaciones ?? null,
    usuarioRegistroNombre: r.usuario_registro_nombre ?? 'Administración',
    createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
  }))
}

/**
 * Registra una nueva carga de combustible con cálculo automático de importe y rendimiento
 */
export async function createFuelCharge(dto: NuevaCargaCombustibleDTO): Promise<{ id: number; success: boolean; rendimientoKmL: number | null }> {
  return withTransaction(async (conn) => {
    // 1. Validar existencia del vehículo y obtener odómetro actual
    const [vehRows] = await conn.execute<any>(
      `SELECT id, odometro_actual FROM vehiculos WHERE id = ? FOR UPDATE`,
      [dto.vehiculoId]
    )

    if (!vehRows || vehRows.length === 0) {
      throw new Error(`El vehículo especificado (#${dto.vehiculoId}) no existe.`)
    }

    const vehiculo = vehRows[0]
    const odometroActual = Number(vehiculo.odometro_actual ?? 0)

    // 2. Calcular importe si no fue provisto
    const litros = Number(dto.litros)
    const precioPorLitro = Number(dto.precioPorLitro)
    const importeTotal = dto.importeTotal ? Number(dto.importeTotal) : Number((litros * precioPorLitro).toFixed(2))

    // 3. Buscar la última carga anterior para calcular rendimiento en Km/L
    let rendimientoKmL: number | null = null
    const [ultimasCargas] = await conn.execute<any>(
      `SELECT odometro_carga, litros 
       FROM cargas_combustible 
       WHERE vehiculo_id = ? 
       ORDER BY fecha_carga DESC, id DESC 
       LIMIT 1`,
      [dto.vehiculoId]
    )

    if (ultimasCargas && ultimasCargas.length > 0) {
      const odoAnterior = Number(ultimasCargas[0].odometro_carga)
      if (dto.odometroCarga > odoAnterior && litros > 0) {
        const kmRecorridos = dto.odometroCarga - odoAnterior
        rendimientoKmL = Number((kmRecorridos / litros).toFixed(2))
      }
    }

    // 4. Insertar registro de carga
    const [resInsert] = await conn.execute<any>(
      `INSERT INTO cargas_combustible (
        vehiculo_id, chofer_id, comision_id, fecha_carga,
        estacion_servicio, tipo_combustible, litros, precio_por_litro,
        importe_total, odometro_carga, tanque_lleno, numero_ticket,
        metodo_pago, rendimiento_km_l, observaciones, usuario_registro_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.vehiculoId,
        dto.choferId ?? null,
        dto.comisionId ?? null,
        dto.fechaCarga,
        dto.estacionServicio ?? null,
        dto.tipoCombustible,
        litros,
        precioPorLitro,
        importeTotal,
        dto.odometroCarga,
        dto.tanqueLleno ?? true ? 1 : 0,
        dto.numeroTicket ?? null,
        dto.metodoPago ?? 'tarjeta_flota',
        rendimientoKmL,
        dto.observaciones ?? null,
        dto.usuarioId ?? null,
      ]
    )

    const nuevoId = resInsert.insertId

    // 5. Si el odómetro de carga es mayor al del vehículo, actualizar odómetro de la flota
    if (dto.odometroCarga > odometroActual) {
      await conn.execute(
        `UPDATE vehiculos SET odometro_actual = ? WHERE id = ?`,
        [dto.odometroCarga, dto.vehiculoId]
      )
    }

    return { id: nuevoId, success: true, rendimientoKmL }
  })
}
