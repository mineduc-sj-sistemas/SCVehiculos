/**
 * Servicio de Alertas Proactivas y Monitor de Vencimientos
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { query } from '../config/db'

export interface OperationalAlert {
  id: string
  tipo: 'rto' | 'licencia' | 'formulario_08' | 'mantenimiento'
  severidad: 'urgente' | 'advertencia'
  titulo: string
  descripcion: string
  referenciaId: number
  diasRestantes?: number
  fechaVencimiento?: string
  enlace: string
}

export interface OperationalAlertsSummary {
  totalAlerts: number
  urgentesCount: number
  advertenciasCount: number
  alerts: OperationalAlert[]
}

export async function getOperationalAlerts(): Promise<OperationalAlertsSummary> {
  const alerts: OperationalAlert[] = []

  try {
    // 1. Alertas de RTO / VTV en Vehículos
    const rtoRows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente,
        v.marca,
        v.modelo,
        v.fecha_vencimiento_vtv,
        DATEDIFF(v.fecha_vencimiento_vtv, CURDATE()) AS dias_restantes
      FROM vehiculos v
      WHERE v.activo = 1 
        AND v.fecha_vencimiento_vtv <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY dias_restantes ASC
    `)

    rtoRows.forEach((r) => {
      const dias = Number(r.dias_restantes)
      const vencida = dias < 0
      alerts.push({
        id: `rto-${r.id}`,
        tipo: 'rto',
        severidad: vencida ? 'urgente' : 'advertencia',
        titulo: vencida ? `RTO VENCIDA · ${r.patente}` : `RTO Próxima a Vencer · ${r.patente}`,
        descripcion: vencida
          ? `${r.marca} ${r.modelo} (${r.patente}) tiene la RTO vencida hace ${Math.abs(dias)} días.`
          : `${r.marca} ${r.modelo} (${r.patente}) vence en ${dias} días (${String(r.fecha_vencimiento_vtv).split('T')[0]}).`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: String(r.fecha_vencimiento_vtv).split('T')[0],
        enlace: `/flota#vehiculo-${r.id}`,
      })
    })

    // 2. Alertas de Licencias de Conducir de Choferes
    const driverRows = await query<any[]>(`
      SELECT 
        c.id,
        c.nombre,
        c.apellido,
        c.dni,
        c.fecha_vencimiento_licencia,
        DATEDIFF(c.fecha_vencimiento_licencia, CURDATE()) AS dias_restantes
      FROM choferes c
      WHERE c.estado != 'inactivo'
        AND c.fecha_vencimiento_licencia <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY dias_restantes ASC
    `)

    driverRows.forEach((r) => {
      const dias = Number(r.dias_restantes)
      const vencida = dias < 0
      alerts.push({
        id: `licencia-${r.id}`,
        tipo: 'licencia',
        severidad: vencida ? 'urgente' : 'advertencia',
        titulo: vencida ? `Carnet Vencido · ${r.apellido}` : `Carnet por Vencer · ${r.apellido}`,
        descripcion: vencida
          ? `El conductor ${r.apellido}, ${r.nombre} (DNI ${r.dni}) tiene su licencia vencida hace ${Math.abs(dias)} días.`
          : `El carnet de ${r.apellido}, ${r.nombre} vence en ${dias} días (${String(r.fecha_vencimiento_licencia).split('T')[0]}).`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: String(r.fecha_vencimiento_licencia).split('T')[0],
        enlace: `/choferes#chofer-${r.id}`,
      })
    })

    // 3. Alertas de Formulario 08 en Trámite
    const form08Rows = await query<any[]>(`
      SELECT 
        v.id,
        v.patente,
        v.marca,
        v.modelo,
        v.fecha_vencimiento_08,
        DATEDIFF(v.fecha_vencimiento_08, CURDATE()) AS dias_restantes
      FROM vehiculos v
      WHERE v.activo = 1 
        AND v.tiene_08 = 1 
        AND v.estado_08 IN ('en_tramite', 'pendiente_firma', 'firmado')
        AND v.fecha_vencimiento_08 IS NOT NULL
        AND v.fecha_vencimiento_08 <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY dias_restantes ASC
    `)

    form08Rows.forEach((r) => {
      const dias = Number(r.dias_restantes)
      const vencida = dias < 0
      alerts.push({
        id: `f08-${r.id}`,
        tipo: 'formulario_08',
        severidad: vencida ? 'urgente' : 'advertencia',
        titulo: vencida ? `Formulario 08 Vencido · ${r.patente}` : `Formulario 08 por Caducar · ${r.patente}`,
        descripcion: vencida
          ? `El Formulario 08 de ${r.marca} ${r.modelo} caducó hace ${Math.abs(dias)} días.`
          : `El trámite de Formulario 08 para ${r.patente} vence en ${dias} días.`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: String(r.fecha_vencimiento_08).split('T')[0],
        enlace: `/flota#vehiculo-${r.id}`,
      })
    })

    // 4. Alertas de Servicios Mecánicos Pendientes / Atrasados
    const mantRows = await query<any[]>(`
      SELECT 
        m.id,
        m.titulo,
        m.fecha_programada,
        v.patente,
        DATEDIFF(m.fecha_programada, CURDATE()) AS dias_restantes
      FROM mantenimientos m
      JOIN vehiculos v ON m.vehiculo_id = v.id
      WHERE m.estado = 'programado'
        AND m.fecha_programada <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY dias_restantes ASC
    `)

    mantRows.forEach((r) => {
      const dias = Number(r.dias_restantes)
      const atrasado = dias < 0
      alerts.push({
        id: `mant-${r.id}`,
        tipo: 'mantenimiento',
        severidad: atrasado ? 'urgente' : 'advertencia',
        titulo: atrasado ? `Service Atrasado · ${r.patente}` : `Service Próximo · ${r.patente}`,
        descripcion: atrasado
          ? `Mantenimiento "${r.titulo}" en ${r.patente} debió ingresar hace ${Math.abs(dias)} días.`
          : `Turno de service para ${r.patente} programado en ${dias} días (${String(r.fecha_programada).split('T')[0]}).`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: String(r.fecha_programada).split('T')[0],
        enlace: `/mantenimientos`,
      })
    })

    const urgentesCount = alerts.filter((a) => a.severidad === 'urgente').length
    const advertenciasCount = alerts.filter((a) => a.severidad === 'advertencia').length

    return {
      totalAlerts: alerts.length,
      urgentesCount,
      advertenciasCount,
      alerts,
    }
  } catch (error) {
    console.error('Error al calcular alertas operativas:', error)
    return {
      totalAlerts: 0,
      urgentesCount: 0,
      advertenciasCount: 0,
      alerts: [],
    }
  }
}
