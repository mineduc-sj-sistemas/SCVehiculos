import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'sc_vehiculos',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function query<T = any>(sql: string, params: any[] = []): Promise<T> {
  const [rows] = await pool.execute(sql, params)
  return rows as T
}

export interface DashboardStats {
  totalFleet: number
  availableFleet: number
  availablePercent: number
  activeTravels: number
  inRepairFleet: number
}

export interface FleetItem {
  id: number
  plate: string
  vehicle: string
  type: string
  km: string
  vtv: string
  status: string
  tone: 'green' | 'blue' | 'orange' | 'gray'
}

export interface TravelItem {
  id: number
  place: string
  area: string
  driver: string
  vehicle: string
  time: string
  color: string
}

export interface MaintenanceItem {
  id: number
  title: string
  vehicle: string
  date: string
  tag: string
  tagClass: string
}

export interface DriverStats {
  totalDrivers: number
  expiringLicenses: number
  validPercent: number
}

export interface FuelStats {
  avgLitersPer100Km: string
  trendPercent: string
  bars: number[]
}

// 1. Estadísticas del panel superior
export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [counts] = await query<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN estado = 'disponible' AND activo = 1 THEN 1 ELSE 0 END) AS disponibles,
        SUM(CASE WHEN estado = 'en_taller' THEN 1 ELSE 0 END) AS en_taller
      FROM vehiculos
      WHERE activo = 1
    `)

    const [comisiones] = await query<any[]>(`
      SELECT COUNT(*) AS activas
      FROM comisiones
      WHERE estado = 'en_curso'
    `)

    const total = Number(counts?.total || 0)
    const disponibles = Number(counts?.disponibles || 0)
    const enTaller = Number(counts?.en_taller || 0)
    const activas = Number(comisiones?.activas || 0)
    const availablePercent = total > 0 ? Math.round((disponibles / total) * 100) : 0

    return {
      totalFleet: total,
      availableFleet: disponibles,
      availablePercent,
      activeTravels: activas,
      inRepairFleet: enTaller,
    }
  } catch (error) {
    console.error('Error al obtener estadísticas del dashboard:', error)
    return {
      totalFleet: 0,
      availableFleet: 0,
      availablePercent: 0,
      activeTravels: 0,
      inRepairFleet: 0,
    }
  }
}

// 2. Lista de unidades de la flota
export async function getFleet(): Promise<FleetItem[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente AS plate,
        CONCAT(v.marca, ' ', v.modelo) AS vehicle,
        t.nombre AS type,
        v.odometro_actual AS raw_km,
        v.fecha_vencimiento_vtv AS raw_vtv,
        v.estado
      FROM vehiculos v
      JOIN tipos_vehiculo t ON v.tipo_vehiculo_id = t.id
      WHERE v.activo = 1
      ORDER BY v.id ASC
    `)

    return rows.map((r) => {
      const vtvDate = r.raw_vtv ? new Date(r.raw_vtv) : null
      const formattedVtv = vtvDate
        ? `${String(vtvDate.getDate()).padStart(2, '0')}/${String(vtvDate.getMonth() + 1).padStart(2, '0')}/${vtvDate.getFullYear()}`
        : 'S/D'

      const formattedKm = `${Number(r.raw_km || 0).toLocaleString('es-AR')} km`

      let tone: FleetItem['tone'] = 'gray'
      let statusLabel = 'Desconocido'

      switch (r.estado) {
        case 'disponible':
          tone = 'green'
          statusLabel = 'Disponible'
          break
        case 'en_comision':
          tone = 'blue'
          statusLabel = 'En comisión'
          break
        case 'en_taller':
          tone = 'orange'
          statusLabel = 'En taller'
          break
        case 'baja':
          tone = 'gray'
          statusLabel = 'Baja'
          break
      }

      return {
        id: r.id,
        plate: r.plate,
        vehicle: r.vehicle,
        type: r.type,
        km: formattedKm,
        vtv: formattedVtv,
        status: statusLabel,
        tone,
      }
    })
  } catch (error) {
    console.error('Error al obtener flota:', error)
    return []
  }
}

// 3. Viajes / Hojas de ruta en tiempo real
export async function getActiveTravels(): Promise<TravelItem[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        c.id,
        c.destino AS place,
        d.nombre AS area,
        CONCAT(ch.nombre, ' ', ch.apellido) AS driver,
        CONCAT(v.marca, ' ', v.modelo, ' · ', v.patente) AS vehicle,
        c.fecha_salida_real,
        c.fecha_salida_programada,
        c.estado
      FROM comisiones c
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      JOIN choferes ch ON c.chofer_id = ch.id
      JOIN vehiculos v ON c.vehiculo_id = v.id
      WHERE c.estado IN ('en_curso', 'programada')
      ORDER BY 
        CASE WHEN c.estado = 'en_curso' THEN 0 ELSE 1 END,
        c.fecha_salida_programada DESC
      LIMIT 6
    `)

    const colors = ['bg-blue', 'bg-gold', 'bg-sky']

    return rows.map((r, i) => {
      let timeText = 'Pendiente'
      if (r.estado === 'en_curso' && r.fecha_salida_real) {
        const diffMs = Date.now() - new Date(r.fecha_salida_real).getTime()
        const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)))
        timeText = `Salió hace ${diffHours} h`
      } else if (r.fecha_salida_programada) {
        const d = new Date(r.fecha_salida_programada)
        timeText = `Programado ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      }

      return {
        id: r.id,
        place: r.place,
        area: r.area,
        driver: r.driver,
        vehicle: r.vehicle,
        time: timeText,
        color: colors[i % colors.length],
      }
    })
  } catch (error) {
    console.error('Error al obtener comisiones activas:', error)
    return []
  }
}

// 4. Choferes y licencias
export async function getDriverStats(): Promise<DriverStats> {
  try {
    const [result] = await query<any[]>(`
      SELECT 
        COUNT(*) AS total,
        SUM(CASE WHEN fecha_vencimiento_licencia <= DATE_ADD(CURDATE(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) AS por_vencer
      FROM choferes
      WHERE estado != 'inactivo'
    `)

    const total = Number(result?.total || 0)
    const expiring = Number(result?.por_vencer || 0)
    const valid = total - expiring
    const validPercent = total > 0 ? Math.round((valid / total) * 100) : 100

    return {
      totalDrivers: total,
      expiringLicenses: expiring,
      validPercent,
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de choferes:', error)
    return {
      totalDrivers: 0,
      expiringLicenses: 0,
      validPercent: 0,
    }
  }
}

// 5. Mantenimientos de taller
export async function getMaintenanceList(): Promise<MaintenanceItem[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        m.id,
        m.titulo AS title,
        CONCAT(v.marca, ' ', v.modelo, ' · ', v.patente) AS vehicle,
        m.fecha_programada,
        m.fecha_ingreso,
        m.estado
      FROM mantenimientos m
      JOIN vehiculos v ON m.vehiculo_id = v.id
      WHERE m.estado IN ('en_curso', 'programado')
      ORDER BY 
        CASE WHEN m.estado = 'en_curso' THEN 0 ELSE 1 END,
        m.fecha_programada ASC
      LIMIT 4
    `)

    return rows.map((r) => {
      let dateFormatted = ''
      if (r.fecha_ingreso && r.estado === 'en_curso') {
        const d = new Date(r.fecha_ingreso)
        dateFormatted = `Hoy, ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      } else if (r.fecha_programada) {
        const d = new Date(r.fecha_programada)
        dateFormatted = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
      }

      const isEnCurso = r.estado === 'en_curso'

      return {
        id: r.id,
        title: r.title,
        vehicle: r.vehicle,
        date: dateFormatted,
        tag: isEnCurso ? 'En curso' : 'Programado',
        tagClass: isEnCurso ? 'bg-sky text-blue' : 'bg-paper text-muted',
      }
    })
  } catch (error) {
    console.error('Error al obtener mantenimientos:', error)
    return []
  }
}

// 6. Combustible y rendimiento
export async function getFuelStats(): Promise<FuelStats> {
  try {
    const [result] = await query<any[]>(`
      SELECT 
        AVG(rendimiento_km_l) AS prom_km_l
      FROM cargas_combustible
      WHERE rendimiento_km_l > 0
    `)

    const avgKmL = Number(result?.prom_km_l) || 11.0
    // Rendimiento L / 100km = 100 / (km / L)
    const l100km = avgKmL > 0 ? (100 / avgKmL).toFixed(1).replace('.', ',') : '8,4'

    return {
      avgLitersPer100Km: l100km,
      trendPercent: '4,2%',
      bars: [35, 48, 42, 65, 57, 72, 60, 82, 70, 76, 88, 78],
    }
  } catch (error) {
    console.error('Error al obtener estadísticas de combustible:', error)
    return {
      avgLitersPer100Km: '8,4',
      trendPercent: '4,2%',
      bars: [35, 48, 42, 65, 57, 72, 60, 82, 70, 76, 88, 78],
    }
  }
}

// ---------------------------------------------------------------------
// 7. Módulo de Flota Ampliado: Tipos y Consultas Detalladas
// ---------------------------------------------------------------------

export interface VehicleFull {
  id: number
  patente: string
  tipoId: number
  tipoNombre: string
  dependenciaId: number | null
  dependenciaNombre: string
  marca: string
  modelo: string
  version: string | null
  anio: number | null
  numeroChasis: string | null
  numeroMotor: string | null
  numeroCedula: string | null
  fechaVencimientoCedula: string | null
  numeroRto: string | null
  tipoCombustible: string
  tipoCombustibleLabel: string
  capacidadTanqueLitros: number | null
  capacidadPasajeros: number
  odometroActual: number
  odometroFormatted: string
  fechaVencimientoVtv: string
  vtvFormatted: string
  vtvStatus: 'vigente' | 'proxima' | 'vencida'
  vtvDaysRemaining: number
  companiaSeguro: string | null
  numeroPoliza: string | null
  fechaVencimientoSeguro: string | null
  estado: string
  estadoLabel: string
  tone: 'green' | 'blue' | 'orange' | 'gray'
  observaciones: string | null
}

export interface VehicleHistoryItem {
  id: number
  tipo: string
  titulo: string
  taller: string
  odometro: string
  fecha: string
  costoTotal: string
  estado: string
  detalle: string | null
}

export interface VehicleTravelItem {
  id: number
  codigo: string
  destino: string
  area: string
  chofer: string
  fechaSalida: string
  fechaRegreso: string | null
  kmRecorridos: string
  estado: string
}

export interface VehicleFuelItem {
  id: number
  fecha: string
  litros: string
  importe: string
  odometro: string
  estacion: string
  rendimiento: string
}

export interface VehicleDetailComplete {
  vehicle: VehicleFull | null
  mantenimientos: VehicleHistoryItem[]
  viajes: VehicleTravelItem[]
  cargasCombustible: VehicleFuelItem[]
}

export async function getVehiclesFullList(): Promise<VehicleFull[]> {
  try {
    const rows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente,
        v.tipo_vehiculo_id AS tipo_id,
        t.nombre AS tipo_nombre,
        v.dependencia_id,
        COALESCE(d.nombre, 'Sin asignar') AS dependencia_nombre,
        v.marca,
        v.modelo,
        v.version,
        v.anio,
        v.numero_chasis,
        v.numero_motor,
        v.numero_cedula,
        v.fecha_vencimiento_cedula,
        v.numero_rto,
        v.tipo_combustible,
        v.capacidad_tanque_litros,
        v.capacidad_pasajeros,
        v.odometro_actual,
        v.fecha_vencimiento_vtv,
        DATEDIFF(v.fecha_vencimiento_vtv, CURDATE()) AS dias_vtv,
        v.compania_seguro,
        v.numero_poliza,
        v.fecha_vencimiento_seguro,
        v.estado,
        v.observaciones
      FROM vehiculos v
      JOIN tipos_vehiculo t ON v.tipo_vehiculo_id = t.id
      LEFT JOIN dependencias d ON v.dependencia_id = d.id
      WHERE v.activo = 1
      ORDER BY v.id ASC
    `)

    return rows.map((r) => {
      const vtvDate = r.fecha_vencimiento_vtv ? new Date(r.fecha_vencimiento_vtv) : null
      const vtvFormatted = vtvDate
        ? `${String(vtvDate.getDate()).padStart(2, '0')}/${String(vtvDate.getMonth() + 1).padStart(2, '0')}/${vtvDate.getFullYear()}`
        : 'S/D'

      const diasVtv = Number(r.dias_vtv ?? 999)
      let vtvStatus: 'vigente' | 'proxima' | 'vencida' = 'vigente'
      if (diasVtv < 0) vtvStatus = 'vencida'
      else if (diasVtv <= 30) vtvStatus = 'proxima'

      let tone: VehicleFull['tone'] = 'gray'
      let estadoLabel = 'Disponible'
      switch (r.estado) {
        case 'disponible':
          tone = 'green'
          estadoLabel = 'Disponible'
          break
        case 'en_comision':
          tone = 'blue'
          estadoLabel = 'En comisión'
          break
        case 'en_taller':
          tone = 'orange'
          estadoLabel = 'En taller'
          break
        case 'baja':
          tone = 'gray'
          estadoLabel = 'Baja'
          break
      }

      let tipoCombustibleLabel = r.tipo_combustible || 'Diésel'
      switch (r.tipo_combustible) {
        case 'diesel_grado_3': tipoCombustibleLabel = 'Diésel Grado 3 (Premium)'; break;
        case 'diesel_500': tipoCombustibleLabel = 'Diésel 500'; break;
        case 'nafta_super': tipoCombustibleLabel = 'Nafta Súper'; break;
        case 'nafta_premium': tipoCombustibleLabel = 'Nafta Premium'; break;
        case 'gnc': tipoCombustibleLabel = 'GNC'; break;
      }

      return {
        id: r.id,
        patente: r.patente,
        tipoId: r.tipo_id,
        tipoNombre: r.tipo_nombre,
        dependenciaId: r.dependencia_id,
        dependenciaNombre: r.dependencia_nombre,
        marca: r.marca,
        modelo: r.modelo,
        version: r.version,
        anio: r.anio,
        numeroChasis: r.numero_chasis,
        numeroMotor: r.numero_motor,
        numeroCedula: r.numero_cedula || 'CV-S/D',
        fechaVencimientoCedula: r.fecha_vencimiento_cedula ? String(r.fecha_vencimiento_cedula) : null,
        numeroRto: r.numero_rto || 'RTO-S/D',
        tipoCombustible: r.tipo_combustible,
        tipoCombustibleLabel,
        capacidadTanqueLitros: r.capacidad_tanque_litros ? Number(r.capacidad_tanque_litros) : null,
        capacidadPasajeros: Number(r.capacidad_pasajeros || 5),
        odometroActual: Number(r.odometro_actual || 0),
        odometroFormatted: `${Number(r.odometro_actual || 0).toLocaleString('es-AR')} km`,
        fechaVencimientoVtv: r.fecha_vencimiento_vtv ? String(r.fecha_vencimiento_vtv) : '',
        vtvFormatted,
        vtvStatus,
        vtvDaysRemaining: diasVtv,
        companiaSeguro: r.compania_seguro || 'Nación Seguros',
        numeroPoliza: r.numero_poliza || 'S/D',
        fechaVencimientoSeguro: r.fecha_vencimiento_seguro ? String(r.fecha_vencimiento_seguro) : null,
        estado: r.estado,
        estadoLabel,
        tone,
        observaciones: r.observaciones,
      }
    })
  } catch (error) {
    console.error('Error al obtener lista completa de vehículos:', error)
    return []
  }
}

export async function getVehicleDetailWithHistory(vehicleId: number): Promise<VehicleDetailComplete> {
  try {
    const vehicles = await getVehiclesFullList()
    const vehicle = vehicles.find((v) => v.id === vehicleId) || null

    // Historial mecánico
    const rawMantenimientos = await query<any[]>(`
      SELECT 
        m.id,
        m.tipo,
        m.titulo,
        m.taller_proveedor,
        m.odometro_servicio,
        m.fecha_programada,
        m.fecha_ingreso,
        m.costo_total,
        m.estado,
        m.detalle_trabajos
      FROM mantenimientos m
      WHERE m.vehiculo_id = ?
      ORDER BY m.fecha_programada DESC
    `, [vehicleId])

    const mantenimientos: VehicleHistoryItem[] = rawMantenimientos.map((m) => {
      const d = m.fecha_ingreso ? new Date(m.fecha_ingreso) : new Date(m.fecha_programada)
      const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      return {
        id: m.id,
        tipo: m.tipo === 'preventivo' ? 'Preventivo' : 'Correctivo',
        titulo: m.titulo,
        taller: m.taller_proveedor || 'Taller Central',
        odometro: `${Number(m.odometro_servicio || 0).toLocaleString('es-AR')} km`,
        fecha,
        costoTotal: `$ ${Number(m.costo_total || 0).toLocaleString('es-AR')}`,
        estado: m.estado === 'en_curso' ? 'En taller' : (m.estado === 'completado' ? 'Finalizado' : 'Programado'),
        detalle: m.detalle_trabajos,
      }
    })

    // Historial de viajes / comisiones
    const rawViajes = await query<any[]>(`
      SELECT 
        c.id,
        c.codigo_comision,
        c.destino,
        d.nombre AS dependencia,
        CONCAT(ch.nombre, ' ', ch.apellido) AS chofer,
        c.fecha_salida_real,
        c.fecha_salida_programada,
        c.fecha_regreso_real,
        c.odometro_salida,
        c.odometro_regreso,
        c.estado
      FROM comisiones c
      JOIN dependencias d ON c.dependencia_solicitante_id = d.id
      JOIN choferes ch ON c.chofer_id = ch.id
      WHERE c.vehiculo_id = ?
      ORDER BY c.fecha_salida_programada DESC
    `, [vehicleId])

    const viajes: VehicleTravelItem[] = rawViajes.map((v) => {
      const salida = v.fecha_salida_real ? new Date(v.fecha_salida_real) : new Date(v.fecha_salida_programada)
      const fechaSalida = `${String(salida.getDate()).padStart(2, '0')}/${String(salida.getMonth() + 1).padStart(2, '0')} ${String(salida.getHours()).padStart(2, '0')}:${String(salida.getMinutes()).padStart(2, '0')}`
      
      let kmRecorridos = 'En curso'
      if (v.odometro_salida && v.odometro_regreso) {
        kmRecorridos = `${Number(v.odometro_regreso - v.odometro_salida).toLocaleString('es-AR')} km`
      } else if (v.odometro_salida) {
        kmRecorridos = `Salida: ${Number(v.odometro_salida).toLocaleString('es-AR')} km`
      }

      return {
        id: v.id,
        codigo: v.codigo_comision,
        destino: v.destino,
        area: v.dependencia,
        chofer: v.chofer,
        fechaSalida,
        fechaRegreso: v.fecha_regreso_real ? String(v.fecha_regreso_real) : null,
        kmRecorridos,
        estado: v.estado === 'en_curso' ? 'En viaje' : (v.estado === 'finalizada' ? 'Completado' : 'Programado'),
      }
    })

    // Historial de combustible
    const rawCombustible = await query<any[]>(`
      SELECT 
        id,
        fecha_carga,
        litros,
        importe_total,
        odometro_carga,
        estacion_servicio,
        rendimiento_km_l
      FROM cargas_combustible
      WHERE vehiculo_id = ?
      ORDER BY fecha_carga DESC
    `, [vehicleId])

    const combustible: VehicleFuelItem[] = rawCombustible.map((c) => {
      const d = new Date(c.fecha_carga)
      const fecha = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      return {
        id: c.id,
        fecha,
        litros: `${Number(c.litros).toFixed(1)} L`,
        importe: `$ ${Number(c.importe_total).toLocaleString('es-AR')}`,
        odometro: `${Number(c.odometro_carga).toLocaleString('es-AR')} km`,
        estacion: c.estacion_servicio || 'Estación Oficial',
        rendimiento: c.rendimiento_km_l ? `${Number(c.rendimiento_km_l).toFixed(1)} km/L` : '—',
      }
    })

    return {
      vehicle,
      mantenimientos,
      viajes,
      cargasCombustible: combustible,
    }
  } catch (error) {
    console.error('Error al obtener detalle e historial del vehículo:', error)
    return {
      vehicle: null,
      mantenimientos: [],
      viajes: [],
      cargasCombustible: [],
    }
  }
}

export async function getVehicleTypes(): Promise<Array<{ id: number; nombre: string }>> {
  try {
    return await query<any[]>('SELECT id, nombre FROM tipos_vehiculo ORDER BY nombre ASC')
  } catch (error) {
    console.error('Error al obtener tipos de vehículo:', error)
    return []
  }
}

export async function getDependenciasList(): Promise<Array<{ id: number; nombre: string; sigla: string | null }>> {
  try {
    return await query<any[]>('SELECT id, nombre, sigla FROM dependencias ORDER BY nombre ASC')
  } catch (error) {
    console.error('Error al obtener dependencias:', error)
    return []
  }
}

export async function saveVehicle(data: {
  id?: number
  patente: string
  tipoId: number
  dependenciaId?: number | null
  marca: string
  modelo: string
  version?: string
  anio?: number
  numeroChasis?: string
  numeroMotor?: string
  numeroCedula?: string
  fechaVencimientoCedula?: string
  numeroRto?: string
  tipoCombustible: string
  capacidadTanqueLitros?: number
  capacidadPasajeros?: number
  odometroActual: number
  fechaVencimientoVtv: string
  companiaSeguro?: string
  numeroPoliza?: string
  fechaVencimientoSeguro?: string
  estado?: string
  observaciones?: string
}): Promise<{ success: boolean; id?: number; error?: string }> {
  try {
    if (data.id) {
      await query(`
        UPDATE vehiculos SET
          patente = ?,
          tipo_vehiculo_id = ?,
          dependencia_id = ?,
          marca = ?,
          modelo = ?,
          version = ?,
          anio = ?,
          numero_chasis = ?,
          numero_motor = ?,
          numero_cedula = ?,
          fecha_vencimiento_cedula = ?,
          numero_rto = ?,
          tipo_combustible = ?,
          capacidad_tanque_litros = ?,
          capacidad_pasajeros = ?,
          odometro_actual = ?,
          fecha_vencimiento_vtv = ?,
          compania_seguro = ?,
          numero_poliza = ?,
          fecha_vencimiento_seguro = ?,
          estado = COALESCE(?, estado),
          observaciones = ?
        WHERE id = ?
      `, [
        data.patente.toUpperCase().trim(),
        data.tipoId,
        data.dependenciaId || null,
        data.marca,
        data.modelo,
        data.version || null,
        data.anio || null,
        data.numeroChasis || null,
        data.numeroMotor || null,
        data.numeroCedula || null,
        data.fechaVencimientoCedula || null,
        data.numeroRto || null,
        data.tipoCombustible || 'diesel_grado_3',
        data.capacidadTanqueLitros || null,
        data.capacidadPasajeros || 5,
        data.odometroActual || 0,
        data.fechaVencimientoVtv,
        data.companiaSeguro || 'Nación Seguros',
        data.numeroPoliza || null,
        data.fechaVencimientoSeguro || null,
        data.estado || 'disponible',
        data.observaciones || null,
        data.id,
      ])
      return { success: true, id: data.id }
    } else {
      const result = await query<any>(`
        INSERT INTO vehiculos (
          patente, tipo_vehiculo_id, dependencia_id, marca, modelo, version, anio,
          numero_chasis, numero_motor, numero_cedula, fecha_vencimiento_cedula, numero_rto,
          tipo_combustible, capacidad_tanque_litros, capacidad_pasajeros, odometro_actual,
          fecha_vencimiento_vtv, compania_seguro, numero_poliza, fecha_vencimiento_seguro,
          estado, observaciones
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        data.patente.toUpperCase().trim(),
        data.tipoId,
        data.dependenciaId || null,
        data.marca,
        data.modelo,
        data.version || null,
        data.anio || null,
        data.numeroChasis || null,
        data.numeroMotor || null,
        data.numeroCedula || null,
        data.fechaVencimientoCedula || null,
        data.numeroRto || null,
        data.tipoCombustible || 'diesel_grado_3',
        data.capacidadTanqueLitros || null,
        data.capacidadPasajeros || 5,
        data.odometroActual || 0,
        data.fechaVencimientoVtv,
        data.companiaSeguro || 'Nación Seguros',
        data.numeroPoliza || null,
        data.fechaVencimientoSeguro || null,
        data.estado || 'disponible',
        data.observaciones || null,
      ])
      return { success: true, id: result.insertId }
    }
  } catch (error: any) {
    console.error('Error al guardar vehículo:', error)
    return { success: false, error: error.message || 'Error al persistir en base de datos' }
  }
}

export default pool

