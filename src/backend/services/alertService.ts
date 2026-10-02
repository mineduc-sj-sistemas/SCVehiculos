/**
 * Servicio de Alertas Proactivas y Monitor de Vencimientos
 * SCVehiculos · Ministerio de Educación · Gobierno de San Juan
 */

import { query } from '../config/db'

export interface OperationalAlert {
  id: string
  tipo: 'rto' | 'licencia' | 'formulario_08' | 'mantenimiento' | 'comision'
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

export interface AlertFilterOptions {
  rolId?: number
  choferId?: number
  usuarioId?: number
}

function formatFechaEs(val: any): string {
  if (!val) return ''
  const d = val instanceof Date ? val : new Date(val)
  if (isNaN(d.getTime())) return String(val).split('T')[0]
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatFechaIso(val: any): string {
  if (!val) return ''
  if (val instanceof Date) return val.toISOString().split('T')[0]
  const s = String(val)
  return s.includes('T') ? s.split('T')[0] : s.split(' ')[0]
}

/**
 * Obtiene las alertas operativas.
 * Si se especifica rol Chofer (rolId: 4), retorna ÚNICAMENTE las alertas personales del chofer:
 * - Su propia licencia de conducir (vencida o por vencer)
 * - Su comisión activa o asignada
 * - RTO o mantenimientos de su vehículo asignado
 * 
 * Si es administrador u operador, retorna el monitoreo global de toda la flota escolar.
 */
export async function getOperationalAlerts(filter?: AlertFilterOptions): Promise<OperationalAlertsSummary> {
  const alerts: OperationalAlert[] = []

  try {
    // -------------------------------------------------------------
    // 1. REGLA DE NEGOCIO: ROL CHOFER (SOLO SUS ALERTAS PERSONALES)
    // -------------------------------------------------------------
    if (filter?.rolId === 4) {
      let choferId = filter.choferId

      if (!choferId && filter.usuarioId) {
        const cRows = await query<any[]>(`SELECT id FROM choferes WHERE usuario_id = ? LIMIT 1`, [filter.usuarioId])
        if (cRows && cRows.length > 0) choferId = cRows[0].id
      }

      if (!choferId) {
        return { totalAlerts: 0, urgentesCount: 0, advertenciasCount: 0, alerts: [] }
      }

      // 1.1 Su propia Licencia de Conducir
      const driverRows = await query<any[]>(`
        SELECT 
          c.id, c.nombre, c.apellido, c.dni, c.numero_licencia, c.categoria_licencia,
          c.fecha_vencimiento_licencia,
          DATEDIFF(c.fecha_vencimiento_licencia, CURDATE()) AS dias_restantes
        FROM choferes c
        WHERE c.id = ? AND c.estado != 'inactivo'
      `, [choferId])

      if (driverRows.length > 0 && driverRows[0].fecha_vencimiento_licencia) {
        const r = driverRows[0]
        const dias = Number(r.dias_restantes)
        const fechaEs = formatFechaEs(r.fecha_vencimiento_licencia)
        const fechaIso = formatFechaIso(r.fecha_vencimiento_licencia)

        if (dias < 0) {
          alerts.push({
            id: `licencia-${r.id}`,
            tipo: 'licencia',
            severidad: 'urgente',
            titulo: 'Licencia de Conducir Vencida',
            descripcion: `Tu licencia (${r.categoria_licencia || 'Profesional'}) venció hace ${Math.abs(dias)} días (${fechaEs}). Debés regularizarla para conducir comisiones oficiales.`,
            referenciaId: r.id,
            diasRestantes: dias,
            fechaVencimiento: fechaIso,
            enlace: '/mi-perfil',
          })
        } else if (dias <= 7) {
          alerts.push({
            id: `licencia-${r.id}`,
            tipo: 'licencia',
            severidad: 'urgente',
            titulo: `Licencia por Vencer (${dias} ${dias === 1 ? 'día' : 'días'})`,
            descripcion: `Tu carnet vence el ${fechaEs}. Gestioná el turno de renovación lo antes posible.`,
            referenciaId: r.id,
            diasRestantes: dias,
            fechaVencimiento: fechaIso,
            enlace: '/mi-perfil',
          })
        } else if (dias <= 30) {
          alerts.push({
            id: `licencia-${r.id}`,
            tipo: 'licencia',
            severidad: 'advertencia',
            titulo: `Aviso: Renovación de Licencia (${dias} días)`,
            descripcion: `Tu carnet vence el ${fechaEs}. Recordá renovarlo con anticipación.`,
            referenciaId: r.id,
            diasRestantes: dias,
            fechaVencimiento: fechaIso,
            enlace: '/mi-perfil',
          })
        }
      }

      // 1.2 Comisión Activa / En Curso
      const activeRows = await query<any[]>(`
        SELECT 
          c.id, c.codigo_comision, c.destino, c.origen, c.fecha_salida_real, c.vehiculo_id,
          v.patente, v.marca, v.modelo, v.fecha_vencimiento_vtv,
          DATEDIFF(v.fecha_vencimiento_vtv, CURDATE()) AS dias_vtv
        FROM comisiones c
        JOIN vehiculos v ON c.vehiculo_id = v.id
        WHERE c.chofer_id = ? AND c.estado = 'en_curso'
        ORDER BY c.fecha_salida_real DESC
        LIMIT 1
      `, [choferId])

      if (activeRows.length > 0) {
        const com = activeRows[0]
        alerts.push({
          id: `comision-activa-${com.id}`,
          tipo: 'comision',
          severidad: 'advertencia',
          titulo: `Comisión en Curso · ${com.codigo_comision}`,
          descripcion: `Viaje activo hacia ${com.destino} en el móvil ${com.marca} ${com.modelo} (${com.patente}). Al regresar recordá escanear el odómetro.`,
          referenciaId: com.id,
          enlace: '/mi-viaje',
        })

        // Si el vehículo asignado tiene la RTO por vencer o vencida
        if (com.dias_vtv != null && Number(com.dias_vtv) <= 30) {
          const diasVtv = Number(com.dias_vtv)
          const vencida = diasVtv < 0
          alerts.push({
            id: `rto-asignada-${com.vehiculo_id}`,
            tipo: 'rto',
            severidad: vencida ? 'urgente' : 'advertencia',
            titulo: vencida ? `RTO Vencida en tu Móvil Asignado (${com.patente})` : `RTO Próxima en tu Móvil Asignado (${com.patente})`,
            descripcion: `El móvil asignado a tu viaje (${com.marca} ${com.modelo}) tiene la RTO ${vencida ? 'vencida hace ' + Math.abs(diasVtv) + ' días' : 'por vencer en ' + diasVtv + ' días'}. Notificalo a la Dirección.`,
            referenciaId: com.vehiculo_id,
            diasRestantes: diasVtv,
            enlace: '/mi-viaje',
          })
        }
      } else {
        // 1.3 Próxima Comisión Programada
        const nextRows = await query<any[]>(`
          SELECT 
            c.id, c.codigo_comision, c.destino, c.fecha_salida_programada, c.vehiculo_id,
            v.patente, v.marca, v.modelo
          FROM comisiones c
          JOIN vehiculos v ON c.vehiculo_id = v.id
          WHERE c.chofer_id = ? AND c.estado = 'programada'
            AND c.fecha_salida_programada >= DATE_SUB(NOW(), INTERVAL 2 HOUR)
          ORDER BY c.fecha_salida_programada ASC
          LIMIT 1
        `, [choferId])

        if (nextRows.length > 0) {
          const next = nextRows[0]
          const fechaProg = next.fecha_salida_programada instanceof Date
            ? next.fecha_salida_programada.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            : String(next.fecha_salida_programada).slice(0, 16)

          alerts.push({
            id: `comision-prog-${next.id}`,
            tipo: 'comision',
            severidad: 'advertencia',
            titulo: `Próximo Viaje Asignado · ${next.codigo_comision}`,
            descripcion: `Tenés una comisión hacia ${next.destino} programada para el ${fechaProg} en ${next.marca} ${next.modelo} (${next.patente}).`,
            referenciaId: next.id,
            enlace: '/mi-viaje',
          })
        }
      }

      const urgentesCount = alerts.filter((a) => a.severidad === 'urgente').length
      const advertenciasCount = alerts.filter((a) => a.severidad === 'advertencia').length

      return {
        totalAlerts: alerts.length,
        urgentesCount,
        advertenciasCount,
        alerts,
      }
    }

    // -------------------------------------------------------------
    // 2. MODO ADMINISTRADOR / GESTOR (PANEL GLOBAL DE FLOTA)
    // -------------------------------------------------------------

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
      const fechaEs = formatFechaEs(r.fecha_vencimiento_vtv)
      const fechaIso = formatFechaIso(r.fecha_vencimiento_vtv)
      alerts.push({
        id: `rto-${r.id}`,
        tipo: 'rto',
        severidad: vencida ? 'urgente' : 'advertencia',
        titulo: vencida ? `RTO VENCIDA · ${r.patente}` : `RTO Próxima a Vencer · ${r.patente}`,
        descripcion: vencida
          ? `${r.marca} ${r.modelo} (${r.patente}) tiene la RTO vencida hace ${Math.abs(dias)} días (${fechaEs}).`
          : `${r.marca} ${r.modelo} (${r.patente}) vence en ${dias} días (${fechaEs}).`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: fechaIso,
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
      const fechaEs = formatFechaEs(r.fecha_vencimiento_licencia)
      const fechaIso = formatFechaIso(r.fecha_vencimiento_licencia)
      alerts.push({
        id: `licencia-${r.id}`,
        tipo: 'licencia',
        severidad: vencida ? 'urgente' : 'advertencia',
        titulo: vencida ? `Carnet Vencido · ${r.apellido}` : `Carnet por Vencer · ${r.apellido}`,
        descripcion: vencida
          ? `El conductor ${r.apellido}, ${r.nombre} (DNI ${r.dni}) tiene su licencia vencida hace ${Math.abs(dias)} días (${fechaEs}).`
          : `El carnet de ${r.apellido}, ${r.nombre} vence en ${dias} días (${fechaEs}).`,
        referenciaId: r.id,
        diasRestantes: dias,
        fechaVencimiento: fechaIso,
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
