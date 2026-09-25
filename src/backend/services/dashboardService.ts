import { query } from '../config/db'
import type {
  DashboardStats,
  TravelItem,
  MaintenanceItem,
  DriverStats,
  FuelStats,
} from '../types/dashboard.types'

/**
 * 1. Estadísticas del panel superior (Total de unidades, disponibles, comisiones y taller)
 */
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

/**
 * 2. Comisiones y viajes en tiempo real
 */
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

/**
 * 3. Choferes y licencias de conducir
 */
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

/**
 * 4. Mantenimientos mecánicos de taller para el widget de dashboard
 */
export async function getDashboardMaintenance(): Promise<MaintenanceItem[]> {
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

/**
 * 5. Consumo de combustible y promedios de flota
 */
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
